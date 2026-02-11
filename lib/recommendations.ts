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
 * Deterministic index from user ID — avoids Math.random() in server components.
 */
function deterministicIndex(userId: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
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

  // Select mood message deterministically
  const messages = GENRE_MOOD_MESSAGES[topGenreId];
  const moodMessage = messages
    ? messages[deterministicIndex(userId, messages.length)]
    : DEFAULT_MOOD_MESSAGE;

  // Pick up to 2 source movies for "Because you liked" rows
  const sourceMovies = topMovies.slice(0, 2).map((m) => ({
    tmdbId: m.tmdbId,
    title: m.title,
  }));

  return {
    moodMessage,
    sourceMovies,
    topGenreId,
    topGenreName,
  };
}
