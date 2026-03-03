import { streamText, tool, stepCountIs, convertToModelMessages } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { geminiModel } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limit";
import { db } from "@/drizzle";
import { watchlist, aiRecommendations, aiConversations } from "@/drizzle/schema";
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
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    // 2. Parse body
    const body: unknown = await request.json();
    const parsed = z
      .object({ messages: z.array(z.unknown()).min(1) })
      .safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

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

    // 5. Get watchlist context for personalization
    const watchlistContext = await getWatchlistContext(user.id);

    const watchlistInstruction = watchlistContext
      ? `\nThe user has previously enjoyed these movies: ${watchlistContext}. Consider this for personalization, but don't recommend these exact movies.`
      : "";

    // 6. Build system prompt
    const systemPrompt = `You are Moodflix AI, a friendly movie and TV show mood expert. Help users find the perfect movies or TV shows by understanding their emotional state.

When you understand the user's mood well enough, call the suggest_genres tool with 1-3 TMDB genres that best match, and set the media_type to "movie" or "tv" based on what fits best. If the user mentions Korean drama, K-drama, C-drama, TV series, shows, or similar terms, set media_type to "tv". Default to "movie" if unclear.

If the user refines their preferences, call suggest_genres again with updated genres and media_type.

If the user is vague, ask ONE clarifying question instead of guessing.

CRITICAL: You MUST only use genre IDs and names from the lists below. NEVER invent genre names or IDs. Country names (e.g. "Korean", "Japanese"), moods (e.g. "Cozy"), or content types (e.g. "Anime") are NOT genres — map them to the closest TMDB genres instead. For example: "Korean comedy" → Comedy (35) with media_type "tv"; "anime" → Animation (16); "cozy movie" → Romance (10749) or Family (10751).

Available TMDB movie genres (use these when media_type is "movie"): ${movieGenreList}
Available TMDB TV genres (use these when media_type is "tv"): ${tvGenreList}
Shared genres (valid for both movie and TV): Comedy (35), Drama (18), Animation (16), Crime (80), Documentary (99), Family (10751), Mystery (9648), Romance (10749), Western (37)
${watchlistInstruction}
Keep responses concise: 2-4 sentences. Be warm and conversational.`;

    // 7. Convert UIMessages to ModelMessages and stream response
    const userId = user.id;
    const modelMessages = await convertToModelMessages(uiMessages as Parameters<typeof convertToModelMessages>[0]);

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
            const moodPrompt = lastMessageText || "mood chat";

            db.insert(aiRecommendations)
              .values({
                userId,
                prompt: moodPrompt,
                recommendations: validatedParams,
              })
              .catch(() => {
                // Non-critical: silently fail
              });

            // Log full conversation (fire-and-forget)
            db.insert(aiConversations)
              .values({
                userId,
                prompt: moodPrompt,
                messages: [...uiMessages, { role: "assistant", parts: [{ type: "text", text: `Suggested: ${validatedParams.genres.map((g) => g.name).join(", ")}` }] }],
              })
              .catch(() => {
                // Non-critical: silently fail
              });

            return { ...validatedParams, confirmed: true };
          },
        }),
      },
      stopWhen: stepCountIs(3),
      maxOutputTokens: 1000,
      maxRetries: 0,
      onError: ({ error }) => {
        console.error("[AI] stream error:", error);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err: unknown) {
    console.error("AI recommend error:", err);

    if (isQuotaOrRateLimitError(err)) {
      return Response.json(
        { error: "AI recommendations are temporarily unavailable. Please try again later." },
        { status: 503 },
      );
    }

    return Response.json(
      { error: "Failed to generate recommendations. Please try again." },
      { status: 500 },
    );
  }
}
