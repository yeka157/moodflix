import { streamText, tool, stepCountIs, type ModelMessage } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { geminiModel } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limit";
import { db } from "@/drizzle";
import { watchlist, aiRecommendations } from "@/drizzle/schema";
import { eq, and, or, ne, isNull, desc, sql } from "drizzle-orm";
import { GENRES } from "@/lib/constants";

const genreList = Object.entries(GENRES)
  .map(([id, name]) => `${name} (${id})`)
  .join(", ");

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

    // 3. Validate last message length
    const messages = parsed.data.messages as Array<{
      role: string;
      content: string;
    }>;
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage?.role === "user" &&
      typeof lastMessage.content === "string" &&
      lastMessage.content.length > 500
    ) {
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
    const systemPrompt = `You are Moodflix AI, a friendly movie mood expert. Help users find the perfect movies by understanding their emotional state.

When you understand the user's mood well enough, call the suggest_genres tool with 1-3 TMDB genres that best match. Then continue your response with 2-3 movie examples that illustrate the mood fit.

If the user refines their preferences, call suggest_genres again with updated genres.

If the user is vague, ask ONE clarifying question instead of guessing.

Available TMDB genres: ${genreList}
${watchlistInstruction}
Keep responses concise: 2-4 sentences. Be warm and conversational.`;

    // 7. Stream response with tool calling
    const userId = user.id;

    const result = streamText({
      model: geminiModel,
      system: systemPrompt,
      messages: messages as ModelMessage[],
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
          }),
          execute: async (params) => {
            // Store recommendation in DB (fire-and-forget)
            const moodPrompt =
              typeof lastMessage?.content === "string"
                ? lastMessage.content
                : "mood chat";

            db.insert(aiRecommendations)
              .values({
                userId,
                prompt: moodPrompt,
                recommendations: params,
              })
              .catch(() => {
                // Non-critical: silently fail
              });

            return { ...params, confirmed: true };
          },
        }),
      },
      stopWhen: stepCountIs(3),
      maxOutputTokens: 1000,
    });

    return result.toUIMessageStreamResponse();
  } catch (err: unknown) {
    console.error("AI recommend error:", err);
    return Response.json(
      { error: "Failed to generate recommendations. Please try again." },
      { status: 500 },
    );
  }
}
