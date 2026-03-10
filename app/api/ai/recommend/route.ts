import {
  streamText,
  tool,
  stepCountIs,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { geminiModel } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limit";
import { searchMulti } from "@/lib/tmdb";
import { db } from "@/drizzle";
import {
  watchlist,
  aiRecommendations,
  aiConversations,
} from "@/drizzle/schema";
import { eq, and, or, ne, isNull, desc, sql } from "drizzle-orm";
import { GENRES, TV_GENRES } from "@/lib/constants";

const movieGenreList = Object.entries(GENRES)
  .map(([id, name]) => `${name} (${id})`)
  .join(", ");

const tvGenreList = Object.entries(TV_GENRES)
  .map(([id, name]) => `${name} (${id})`)
  .join(", ");

function isQuotaOrRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  if (
    msg.includes("quota") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("Too Many Requests")
  ) {
    return true;
  }
  if (err instanceof Error && err.cause) {
    return isQuotaOrRateLimitError(err.cause);
  }
  return false;
}

const OFF_TOPIC_PATTERNS = [
  /\b(write|draft|compose)\b.*(essay|letter|email|resume|cover letter)/i,
  /\b(solve|calculate|compute)\b.*(math|equation|problem)/i,
  /\b(code|program|debug)\b.*(javascript|python|css|html|bug)/i,
  /\b(recipe|cook|bake|ingredient)/i,
  /\b(homework|assignment|exam|test\s+prep)/i,
  /\b(medical|diagnosis|symptom|prescription)/i,
  /\b(legal|lawsuit|contract|attorney)/i,
  /\b(translate|translation)\b/i,
];

const REDIRECT_MESSAGES = [
  "That's a plot twist I wasn't expecting! I'm your movie mood matchmaker -- what kind of vibe are you feeling tonight?",
  "Whoa, wrong set! I'm the movie expert around here. Tell me what mood you're in and I'll find the perfect watch.",
  "Cut! That's not in my script. But I do know a thing or two about finding the perfect movie for your mood. What are you feeling?",
  "Looks like you wandered onto the wrong soundstage! I'm all about movies and TV -- tell me your mood and I'll roll the perfect pick.",
];

function isOffTopic(text: string): boolean {
  return OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(text));
}

type ConversationMetadata = {
  toolUsed: "suggest_genres" | "identify_media" | "none";
  genresSuggested: string[];
  mediaIdentified: string[];
  messageCount: number;
  isOffTopic: boolean;
};

function buildConversationMetadata(
  steps: ReadonlyArray<{
    toolCalls?: ReadonlyArray<{
      toolName: string;
      input: unknown;
    }>;
    toolResults?: ReadonlyArray<{
      toolName: string;
      output?: unknown;
    }>;
  }>,
  messageCount: number,
): ConversationMetadata {
  let toolUsed: ConversationMetadata["toolUsed"] = "none";
  const genresSuggested: string[] = [];
  const mediaIdentified: string[] = [];

  for (const step of steps) {
    for (const call of step.toolCalls ?? []) {
      if (call.toolName === "suggest_genres") {
        toolUsed = "suggest_genres";
        const input = call.input as { genres?: Array<{ name: string }> };
        if (Array.isArray(input.genres)) {
          genresSuggested.push(...input.genres.map((g) => g.name));
        }
      } else if (call.toolName === "identify_media") {
        toolUsed = "identify_media";
      }
    }
    for (const toolResult of step.toolResults ?? []) {
      if (toolResult.toolName === "identify_media") {
        const output = toolResult.output as
          | { matches?: Array<{ title: string }> }
          | undefined;
        if (Array.isArray(output?.matches)) {
          mediaIdentified.push(...output.matches.map((m) => m.title));
        }
      }
    }
  }

  return {
    toolUsed,
    genresSuggested,
    mediaIdentified,
    messageCount,
    isOffTopic: false,
  };
}

function upsertConversation(params: {
  userId: string;
  conversationId: string | undefined;
  messages: unknown[];
  prompt: string;
  metadata: Record<string, unknown>;
}): void {
  const { userId, conversationId, messages, prompt, metadata } = params;
  if (conversationId) {
    db.insert(aiConversations)
      .values({ userId, prompt, messages, conversationId, metadata })
      .onConflictDoUpdate({
        target: [aiConversations.conversationId],
        set: { messages, prompt, updatedAt: new Date(), metadata },
      })
      .catch(() => {});
  } else {
    db.insert(aiConversations)
      .values({ userId, prompt, messages, metadata })
      .catch(() => {});
  }
}

async function getWatchlistContext(userId: string): Promise<string> {
  const likedMovies = await db
    .select({ title: watchlist.title })
    .from(watchlist)
    .where(
      and(
        eq(watchlist.userId, userId),
        or(isNull(watchlist.rating), ne(watchlist.rating, -1)),
      ),
    )
    .orderBy(sql`${watchlist.rating} DESC NULLS LAST`, desc(watchlist.addedAt))
    .limit(5);

  if (likedMovies.length === 0) return "";
  return likedMovies.map((m) => m.title).join(", ");
}

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // 2. Parse body
    const body: unknown = await request.json();
    const parsed = z
      .object({
        messages: z.array(z.unknown()).min(1),
        conversationId: z.string().optional(),
      })
      .safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const conversationId = parsed.data.conversationId;

    // 3. Validate last message length (UIMessages have `parts`, not `content`)
    const uiMessages = parsed.data.messages as Array<{
      role: string;
      parts?: Array<{ type: string; text?: string }>;
    }>;
    const lastMessage = uiMessages[uiMessages.length - 1];
    const lastMessageText =
      lastMessage?.role === "user"
        ? (lastMessage.parts ?? [])
            .filter((p) => p.type === "text")
            .map((p) => p.text ?? "")
            .join("")
        : "";

    if (lastMessageText.length > 500) {
      return Response.json(
        { error: "Message must be under 500 characters" },
        { status: 400 },
      );
    }

    // 4. Rate limit check
    const rateResult = checkRateLimit(user.id);
    if (!rateResult.allowed) {
      return Response.json(
        { error: "Daily recommendation limit reached. Try again tomorrow." },
        {
          status: 429,
          headers: { "Retry-After": String(rateResult.resetInSeconds) },
        },
      );
    }

    // 5. Off-topic pre-check filter
    if (isOffTopic(lastMessageText)) {
      const message = REDIRECT_MESSAGES[Date.now() % REDIRECT_MESSAGES.length];

      // Log off-topic conversation (fire-and-forget)
      const offTopicMessages = [
        ...uiMessages,
        { role: "assistant", parts: [{ type: "text", text: message }] },
      ];
      upsertConversation({
        userId: user.id,
        conversationId,
        messages: offTopicMessages,
        prompt: lastMessageText || "off-topic",
        metadata: {
          toolUsed: "none",
          isOffTopic: true,
          messageCount: offTopicMessages.length,
        },
      });

      const stream = createUIMessageStream({
        execute: ({ writer }) => {
          writer.write({
            type: "text-delta",
            delta: message,
            id: crypto.randomUUID(),
          });
        },
      });

      return createUIMessageStreamResponse({ stream, status: 200 });
    }

    // 6. Get watchlist context for personalization
    const watchlistContext = await getWatchlistContext(user.id);

    const watchlistInstruction = watchlistContext
      ? `\nThe user has previously enjoyed these movies: ${watchlistContext}. Consider this for personalization, but don't recommend these exact movies.`
      : "";

    // 7. Build system prompt
    const systemPrompt = `You are Moodflix AI, a friendly movie and TV show mood expert. Help users find the perfect movies or TV shows by understanding their emotional state.

When you understand the user's mood well enough, call the suggest_genres tool with 1-3 TMDB genres that best match, and set the media_type to "movie" or "tv" based on what fits best. If the user mentions Korean drama, K-drama, C-drama, TV series, shows, or similar terms, set media_type to "tv". Default to "movie" if unclear.

If the user refines their preferences, call suggest_genres again with updated genres and media_type.

If the user is vague, ask ONE clarifying question instead of guessing.

CRITICAL: You MUST only use genre IDs and names from the lists below. NEVER invent genre names or IDs. Country names (e.g. "Korean", "Japanese"), moods (e.g. "Cozy"), or content types (e.g. "Anime") are NOT genres — map them to the closest TMDB genres instead. For example: "Korean comedy" → Comedy (35) with media_type "tv"; "anime" → Animation (16); "cozy movie" → Romance (10749) or Family (10751).

Available TMDB movie genres (use these when media_type is "movie"): ${movieGenreList}
Available TMDB TV genres (use these when media_type is "tv"): ${tvGenreList}
Shared genres (valid for both movie and TV): Comedy (35), Drama (18), Animation (16), Crime (80), Documentary (99), Family (10751), Mystery (9648), Romance (10749), Western (37)

ORIGIN COUNTRY DETECTION:
When the user references content from a specific country or culture, include the origin_country field (ISO 3166-1 alpha-2 code) in your suggest_genres call. Examples:
- "K-drama", "Korean drama" -> origin_country: "KR", media_type: "tv"
- "anime", "Japanese animation" -> origin_country: "JP"
- "Bollywood" -> origin_country: "IN"
- "telenovela" -> origin_country: "MX", media_type: "tv"
- "Nollywood" -> origin_country: "NG"
- "British comedy" -> origin_country: "GB"
- "French cinema" -> origin_country: "FR"
If you cannot confidently determine an origin country, do NOT include origin_country -- just suggest genres without it.

MEDIA IDENTIFICATION:
When a user describes a specific movie or TV show (mentions specific scenes, plot points, characters, quotes, or distinctive elements), identify it by calling identify_media with 1-3 candidate matches ranked by confidence.

Confidence routing:
- If you're quite sure (one clear match): provide 1 candidate with "high" confidence
- If it could be 2-3 things: provide all candidates ranked by confidence
- If the description is too vague to identify anything specific (no plot points, no characters, no distinctive scenes -- just a general vibe): do NOT call identify_media. Instead, ask ONE specific follow-up question to narrow it down (e.g., "Do you remember any actors?" or "Was it animated or live-action?")

Examples:
- "the movie where the guy grows potatoes on Mars" -> 1 candidate: The Martian (high)
- "that movie about time loops" -> 3 candidates: Groundhog Day (high), Edge of Tomorrow (medium), Palm Springs (medium)
- "some movie I saw once about a dog" -> TOO VAGUE, ask follow-up question

Do NOT use identify_media for:
- Mood descriptions ("I feel sad")
- Genre requests ("action movies")
- "Something like X" requests (use suggest_genres with matching genres)

OFF-TOPIC HANDLING:
You are ONLY a movie and TV show recommendation assistant. If the user asks about non-entertainment topics, gently redirect them to movie/TV topics with a witty, cinematic response. Do NOT call suggest_genres for off-topic queries.
However, be BROAD about what counts as entertainment-related. Cultural references (Ghibli, Tarantino), vibes (cozy, intense), real-world events (Oscar winners), actors, directors -- all of these are on-topic.
${watchlistInstruction}
Keep responses concise: 2-4 sentences. Be warm and conversational.`;

    // 8. Convert UIMessages to ModelMessages and stream response
    const userId = user.id;
    const modelMessages = await convertToModelMessages(
      uiMessages as Parameters<typeof convertToModelMessages>[0],
    );

    const result = streamText({
      model: geminiModel,
      system: systemPrompt,
      messages: modelMessages,
      tools: {
        suggest_genres: tool({
          description:
            "Suggest TMDB genres that match the user's mood. Call this whenever you have a genre recommendation ready.",
          inputSchema: z.object({
            genres: z
              .array(
                z.object({
                  id: z.number().describe("TMDB genre ID from the available list"),
                  name: z.string().describe("Genre name"),
                }),
              )
              .min(1)
              .max(3),
            moodSummary: z
              .string()
              .describe("A short summary of the user's mood or preference"),
            media_type: z
              .enum(["movie", "tv"])
              .describe("Whether to recommend movies or TV shows")
              .default("movie"),
            origin_country: z
              .string()
              .length(2)
              .optional()
              .describe(
                "ISO 3166-1 alpha-2 country code when user requests content from a specific country/culture (e.g., KR for Korean, JP for Japanese)",
              ),
          }),
          execute: async (params) => {
            // Validate genre IDs against known TMDB genres
            const validGenres = { ...GENRES, ...TV_GENRES };
            const filteredGenres = params.genres.filter(
              (g) => validGenres[g.id] !== undefined,
            );
            const validatedParams = {
              ...params,
              // Use validated genres (with correct TMDB names), fall back to original if all filtered out
              genres:
                filteredGenres.length > 0
                  ? filteredGenres.map((g) => ({
                      id: g.id,
                      name: validGenres[g.id] ?? g.name,
                    }))
                  : params.genres,
            };

            // Store recommendation in DB (fire-and-forget)
            db.insert(aiRecommendations)
              .values({
                userId,
                prompt: lastMessageText || "mood chat",
                recommendations: validatedParams,
              })
              .catch(() => {
                // Non-critical: silently fail
              });

            return {
              ...validatedParams,
              origin_country: params.origin_country,
              confirmed: true,
            };
          },
        }),
        identify_media: tool({
          description:
            "Identify a specific movie or TV show from the user's description. Provide 1-3 candidate matches ranked by confidence.",
          inputSchema: z.object({
            query: z
              .string()
              .describe("Brief summary of what the user is describing"),
            candidates: z
              .array(
                z.object({
                  title: z.string(),
                  mediaType: z.enum(["movie", "tv"]),
                  year: z.string().optional(),
                  confidence: z.enum(["high", "medium", "low"]),
                }),
              )
              .min(1)
              .max(3),
          }),
          execute: async (params) => {
            // Search TMDB for each candidate to verify
            const verifiedMatches = await Promise.all(
              params.candidates.map(async (candidate) => {
                const results = await searchMulti(candidate.title);
                const targetType = candidate.mediaType === "tv" ? "tv" : "movie";

                const match =
                  results.results.find(
                    (r) =>
                      r.media_type === targetType &&
                      (r.title ?? r.name ?? "")
                        .toLowerCase()
                        .includes(candidate.title.toLowerCase().split(" ")[0]),
                  ) ??
                  results.results.find((r) => r.media_type === targetType) ??
                  results.results[0];

                if (!match) return null;

                return {
                  title: match.title ?? match.name ?? candidate.title,
                  tmdbId: match.id,
                  mediaType:
                    match.media_type === "tv"
                      ? ("tv" as const)
                      : ("movie" as const),
                  year:
                    (match.release_date ?? match.first_air_date ?? "").slice(
                      0,
                      4,
                    ) || candidate.year,
                  confidence: candidate.confidence,
                  verified: true,
                  posterPath: match.poster_path,
                  overview: match.overview,
                };
              }),
            );

            // Filter out unverified (null) results
            const matches = verifiedMatches.filter(
              (m): m is NonNullable<typeof m> => m !== null,
            );

            return { matches, query: params.query };
          },
        }),
      },
      stopWhen: stepCountIs(3),
      maxOutputTokens: 1000,
      maxRetries: 0,
      onError: ({ error }) => {
        console.error("[AI] stream error:", error);
      },
      onFinish: (event) => {
        // Build structured metadata from all steps (verbatim AI text)
        const metadata = buildConversationMetadata(
          event.steps,
          uiMessages.length + 1,
        ) as Record<string, unknown>;

        const fullMessages = [
          ...uiMessages,
          { role: "assistant", parts: [{ type: "text", text: event.text }] },
        ];

        // Upsert conversation with verbatim text (fire-and-forget)
        upsertConversation({
          userId,
          conversationId,
          messages: fullMessages,
          prompt: lastMessageText || "mood chat",
          metadata,
        });
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err: unknown) {
    console.error("AI recommend error:", err);

    if (isQuotaOrRateLimitError(err)) {
      return Response.json(
        {
          error:
            "AI recommendations are temporarily unavailable. Please try again later.",
        },
        { status: 503 },
      );
    }

    return Response.json(
      { error: "Failed to generate recommendations. Please try again." },
      { status: 500 },
    );
  }
}
