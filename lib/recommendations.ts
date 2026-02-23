import { db } from "@/drizzle";
import { watchlist } from "@/drizzle/schema";
import { eq, and, or, ne, isNull, desc, sql } from "drizzle-orm";
import { getMovieDetails } from "@/lib/tmdb";
import {
  GENRES,
  GENRE_MOOD_MESSAGES,
  DEFAULT_MOOD_MESSAGE,
} from "@/lib/constants";
import type { PersonalizedData } from "@/types/movie";

/**
 * Deterministic seed from input string — avoids Math.random() in server components.
 * Accepts any string (e.g., userId + date) for daily rotation.
 */
function deterministicSeed(input: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % length;
}

export async function getPersonalizedData(
  userId: string,
): Promise<PersonalizedData | null> {
  // Get top 5 watchlist items, excluding disliked (rating = -1).
  // SQL: WHERE user_id = ? AND (rating IS NULL OR rating != -1)
  // Ordered: liked (1) first, then unrated (NULL), by recency.
  const topMovies = await db
    .select({
      tmdbId: watchlist.tmdbId,
      title: watchlist.title,
    })
    .from(watchlist)
    .where(
      and(
        eq(watchlist.userId, userId),
        or(isNull(watchlist.rating), ne(watchlist.rating, -1)),
      ),
    )
    .orderBy(sql`${watchlist.rating} DESC NULLS LAST`, desc(watchlist.addedAt))
    .limit(5);

  if (topMovies.length === 0) return null;

  // Fetch TMDB details for top 3 to get genre information
  const moviesToFetch = topMovies.slice(0, 3);
  const details = await Promise.all(
    moviesToFetch.map((m) => getMovieDetails(m.tmdbId).catch(() => null)),
  );

  // Compute genre frequency
  const genreFrequency: Record<number, number> = {};
  for (const detail of details) {
    if (!detail) continue;
    for (const genre of detail.genres) {
      genreFrequency[genre.id] = (genreFrequency[genre.id] ?? 0) + 1;
    }
  }

  const sortedGenres = Object.entries(genreFrequency)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => Number(id));

  if (sortedGenres.length === 0) return null;

  const topGenreId = sortedGenres[0];
  const topGenreName = GENRES[topGenreId] ?? "Movies";

  // Daily seed for rotation — changes once per day, deterministic per user
  const dailySeed = userId + new Date().toDateString();

  // Select mood message using daily seed
  const messages = GENRE_MOOD_MESSAGES[topGenreId];
  const moodMessage = messages
    ? messages[deterministicSeed(dailySeed + "mood", messages.length)]
    : DEFAULT_MOOD_MESSAGE;

  // Pick source movies using daily rotation from top-5
  const primaryIndex = deterministicSeed(dailySeed, topMovies.length);
  const sourceMovies: { tmdbId: number; title: string }[] = [
    { tmdbId: topMovies[primaryIndex].tmdbId, title: topMovies[primaryIndex].title },
  ];

  if (topMovies.length >= 2) {
    const secondIndex = deterministicSeed(dailySeed + "second", topMovies.length - 1);
    const adjustedIndex = secondIndex >= primaryIndex ? secondIndex + 1 : secondIndex;
    sourceMovies.push({
      tmdbId: topMovies[adjustedIndex].tmdbId,
      title: topMovies[adjustedIndex].title,
    });
  }

  const rowPatternIndex = deterministicSeed(dailySeed + "pattern", 6);

  return {
    moodMessage,
    sourceMovies,
    topGenreId,
    topGenreName,
    rowPatternIndex,
  };
}
