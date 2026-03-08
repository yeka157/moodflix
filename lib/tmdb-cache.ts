// Server-only: uses database
import { db } from "@/drizzle";
import { tmdbCache, tmdbMedia } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  getTrendingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  getTrendingTV,
  getOnTheAirTV,
  getTopRatedTV,
  getMovieDetails,
  getTVDetails,
  discoverKoreanDramas,
  discoverChineseDramas,
} from "@/lib/tmdb";
import type { MovieListResponse, MovieDetailsWithExtras } from "@/types/movie";
import type { TVListResponse, TVDetailsWithExtras } from "@/types/tv";

// TTL constants
const CATEGORY_TTL = 24 * 60 * 60 * 1000; // 24 hours
const RATINGS_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
// DETAILS_TTL is Infinity (permanent) -- never stale

export function isStale(updatedAt: Date | null, ttlMs: number): boolean {
  if (!updatedAt) return true;
  return Date.now() - updatedAt.getTime() > ttlMs;
}

// Generic cache reader for category list responses
async function getCachedCategory<T>(
  key: string,
  category: string,
  mediaType: "movie" | "tv",
  fetcher: () => Promise<T>,
): Promise<T> {
  try {
    const [cached] = await db
      .select()
      .from(tmdbCache)
      .where(eq(tmdbCache.key, key))
      .limit(1);

    if (cached && !isStale(cached.updatedAt, CATEGORY_TTL)) {
      return cached.data as T;
    }
  } catch {
    // Cache read failed, fall through to fetcher
  }

  const fresh = await fetcher();

  // Fire-and-forget upsert
  db.insert(tmdbCache)
    .values({ key, category, mediaType, data: fresh as unknown as Record<string, unknown>, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: tmdbCache.key,
      set: { data: fresh as unknown as Record<string, unknown>, updatedAt: new Date() },
    })
    .catch(() => {});

  return fresh;
}

// Cached category wrappers -- same return types as originals
export async function getCachedTrending(page = 1): Promise<MovieListResponse> {
  return getCachedCategory(
    `trending_movie_week_${page}`,
    "trending",
    "movie",
    () => getTrendingMovies(page),
  );
}

export async function getCachedPopular(page = 1): Promise<MovieListResponse> {
  return getCachedCategory(
    `popular_movie_${page}`,
    "popular",
    "movie",
    () => getPopularMovies(page),
  );
}

export async function getCachedTopRated(page = 1): Promise<MovieListResponse> {
  return getCachedCategory(
    `top_rated_movie_${page}`,
    "top_rated",
    "movie",
    () => getTopRatedMovies(page),
  );
}

export async function getCachedUpcoming(page = 1, region = "US"): Promise<MovieListResponse> {
  return getCachedCategory(
    `upcoming_movie_${region}_${page}`,
    "upcoming",
    "movie",
    () => getUpcomingMovies(page, region),
  );
}

export async function getCachedTrendingTV(page = 1): Promise<TVListResponse> {
  return getCachedCategory(
    `trending_tv_week_${page}`,
    "trending",
    "tv",
    () => getTrendingTV(page),
  );
}

export async function getCachedOnTheAirTV(page = 1): Promise<TVListResponse> {
  return getCachedCategory(
    `on_the_air_tv_v3_${page}`,
    "on_the_air",
    "tv",
    () => getOnTheAirTV(page),
  );
}

export async function getCachedTopRatedTV(page = 1): Promise<TVListResponse> {
  return getCachedCategory(
    `top_rated_tv_${page}`,
    "top_rated",
    "tv",
    () => getTopRatedTV(page),
  );
}

export async function getCachedKoreanDramas(page = 1): Promise<TVListResponse> {
  return getCachedCategory(
    `korean_dramas_${page}`,
    "korean_dramas",
    "tv",
    () => discoverKoreanDramas(page),
  );
}

export async function getCachedChineseDramas(page = 1): Promise<TVListResponse> {
  return getCachedCategory(
    `chinese_dramas_${page}`,
    "chinese_dramas",
    "tv",
    () => discoverChineseDramas(page),
  );
}

// Detail cache functions -- permanent cache for individual titles
export async function getCachedMovieDetails(id: number): Promise<MovieDetailsWithExtras> {
  try {
    const [cached] = await db
      .select()
      .from(tmdbMedia)
      .where(and(eq(tmdbMedia.tmdbId, id), eq(tmdbMedia.mediaType, "movie")))
      .limit(1);

    if (cached?.detailsData && cached.detailsFetchedAt) {
      return cached.detailsData as unknown as MovieDetailsWithExtras;
    }
  } catch {
    // Cache read failed, fall through to fetcher
  }

  const fresh = await getMovieDetails(id);

  // Fire-and-forget upsert
  db.insert(tmdbMedia)
    .values({
      tmdbId: id,
      mediaType: "movie",
      title: fresh.title,
      overview: fresh.overview ?? null,
      posterPath: fresh.poster_path,
      backdropPath: fresh.backdrop_path,
      releaseDate: fresh.release_date ?? null,
      voteAverage: fresh.vote_average != null ? String(fresh.vote_average) : null,
      voteCount: fresh.vote_count ?? null,
      genreIds: fresh.genre_ids ?? null,
      popularity: fresh.popularity != null ? String(fresh.popularity) : null,
      runtime: fresh.runtime ?? null,
      detailsData: fresh as unknown as Record<string, unknown>,
      detailsFetchedAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [tmdbMedia.tmdbId, tmdbMedia.mediaType],
      set: {
        title: fresh.title,
        overview: fresh.overview ?? null,
        posterPath: fresh.poster_path,
        backdropPath: fresh.backdrop_path,
        voteAverage: fresh.vote_average != null ? String(fresh.vote_average) : null,
        voteCount: fresh.vote_count ?? null,
        runtime: fresh.runtime ?? null,
        detailsData: fresh as unknown as Record<string, unknown>,
        detailsFetchedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .catch(() => {});

  return fresh;
}

export async function getCachedTVDetails(id: number): Promise<TVDetailsWithExtras> {
  try {
    const [cached] = await db
      .select()
      .from(tmdbMedia)
      .where(and(eq(tmdbMedia.tmdbId, id), eq(tmdbMedia.mediaType, "tv")))
      .limit(1);

    if (cached?.detailsData && cached.detailsFetchedAt) {
      return cached.detailsData as unknown as TVDetailsWithExtras;
    }
  } catch {
    // Cache read failed, fall through to fetcher
  }

  const fresh = await getTVDetails(id);

  // Fire-and-forget upsert
  db.insert(tmdbMedia)
    .values({
      tmdbId: id,
      mediaType: "tv",
      title: fresh.name,
      overview: fresh.overview ?? null,
      posterPath: fresh.poster_path,
      backdropPath: fresh.backdrop_path,
      releaseDate: fresh.first_air_date ?? null,
      voteAverage: fresh.vote_average != null ? String(fresh.vote_average) : null,
      voteCount: fresh.vote_count ?? null,
      genreIds: fresh.genre_ids ?? null,
      popularity: fresh.popularity != null ? String(fresh.popularity) : null,
      numberOfSeasons: fresh.number_of_seasons ?? null,
      detailsData: fresh as unknown as Record<string, unknown>,
      detailsFetchedAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [tmdbMedia.tmdbId, tmdbMedia.mediaType],
      set: {
        title: fresh.name,
        overview: fresh.overview ?? null,
        posterPath: fresh.poster_path,
        backdropPath: fresh.backdrop_path,
        voteAverage: fresh.vote_average != null ? String(fresh.vote_average) : null,
        voteCount: fresh.vote_count ?? null,
        numberOfSeasons: fresh.number_of_seasons ?? null,
        detailsData: fresh as unknown as Record<string, unknown>,
        detailsFetchedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .catch(() => {});

  return fresh;
}

// Re-export TTL constants for external use
export { CATEGORY_TTL, RATINGS_TTL };
