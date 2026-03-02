import type { MovieListResponse, MovieDetailsWithExtras } from "@/types/movie";
import type { TVListResponse, TVDetailsWithExtras } from "@/types/tv";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

async function tmdbFetch<T>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.set(key, value),
    );
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_API_READ_KEY}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(
      `TMDB API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}

export async function getTrendingMovies(page = 1) {
  return tmdbFetch<MovieListResponse>("/trending/movie/week", {
    page: String(page),
  });
}

export async function getPopularMovies(page = 1) {
  return tmdbFetch<MovieListResponse>("/movie/popular", {
    page: String(page),
  });
}

export async function getTopRatedMovies(page = 1) {
  return tmdbFetch<MovieListResponse>("/movie/top_rated", {
    page: String(page),
  });
}

export async function searchMovies(query: string, page = 1) {
  return tmdbFetch<MovieListResponse>("/search/movie", {
    query,
    page: String(page),
    include_adult: "false",
  });
}

export async function getMovieDetails(id: number) {
  return tmdbFetch<MovieDetailsWithExtras>(`/movie/${id}`, {
    append_to_response: "credits,watch/providers",
  });
}

export async function discoverMoviesByGenre(genreIds: string, page = 1) {
  return tmdbFetch<MovieListResponse>("/discover/movie", {
    with_genres: genreIds,
    sort_by: "popularity.desc",
    page: String(page),
    include_adult: "false",
  });
}

export async function discoverMovies(
  opts: {
    genreIds?: string;
    sortBy?: string;
    year?: string;
    yearStart?: string;
    yearEnd?: string;
    page?: number;
  } = {},
) {
  const params: Record<string, string> = {
    sort_by: opts.sortBy ?? "popularity.desc",
    page: String(opts.page ?? 1),
    include_adult: "false",
    "vote_count.gte": "10",
  };
  if (opts.genreIds) params.with_genres = opts.genreIds;
  if (opts.year) params.primary_release_year = opts.year;
  if (opts.yearStart) params["primary_release_date.gte"] = `${opts.yearStart}-01-01`;
  if (opts.yearEnd) params["primary_release_date.lte"] = `${opts.yearEnd}-12-31`;
  return tmdbFetch<MovieListResponse>("/discover/movie", params);
}

export async function discoverTV(
  opts: {
    genreIds?: string;
    sortBy?: string;
    year?: string;
    yearStart?: string;
    yearEnd?: string;
    page?: number;
  } = {},
) {
  const params: Record<string, string> = {
    sort_by: opts.sortBy ?? "popularity.desc",
    page: String(opts.page ?? 1),
    "vote_count.gte": "10",
  };
  if (opts.genreIds) params.with_genres = opts.genreIds;
  if (opts.year) params.first_air_date_year = opts.year;
  if (opts.yearStart) params["first_air_date.gte"] = `${opts.yearStart}-01-01`;
  if (opts.yearEnd) params["first_air_date.lte"] = `${opts.yearEnd}-12-31`;
  return tmdbFetch<TVListResponse>("/discover/tv", params);
}

export async function getMovieRecommendations(movieId: number, page = 1) {
  return tmdbFetch<MovieListResponse>(`/movie/${movieId}/recommendations`, {
    page: String(page),
  });
}

export async function getPopularMoviesInRegion(region: string, page = 1) {
  return tmdbFetch<MovieListResponse>("/movie/popular", {
    page: String(page),
    region,
  });
}

export async function getTrendingTV(page = 1) {
  return tmdbFetch<TVListResponse>("/trending/tv/week", {
    page: String(page),
  });
}

export async function getAiringTodayTV(page = 1) {
  return tmdbFetch<TVListResponse>("/tv/airing_today", {
    page: String(page),
  });
}

export async function getTopRatedTV(page = 1) {
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  return tmdbFetch<TVListResponse>("/discover/tv", {
    sort_by: "first_air_date.desc",
    "vote_count.gte": "50",
    "vote_average.gte": "7.5",
    "first_air_date.gte": twoYearsAgo.toISOString().slice(0, 10),
    page: String(page),
  });
}

export async function discoverKoreanDramas(page = 1) {
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  return tmdbFetch<TVListResponse>("/discover/tv", {
    with_origin_country: "KR",
    with_genres: "18",
    with_original_language: "ko",
    sort_by: "first_air_date.desc",
    "vote_count.gte": "1",
    "first_air_date.gte": twoYearsAgo.toISOString().slice(0, 10),
    page: String(page),
  });
}

export async function discoverChineseDramas(page = 1) {
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  return tmdbFetch<TVListResponse>("/discover/tv", {
    with_origin_country: "CN",
    with_genres: "18",
    sort_by: "first_air_date.desc",
    "vote_count.gte": "1",
    "first_air_date.gte": twoYearsAgo.toISOString().slice(0, 10),
    page: String(page),
  });
}

export async function discoverTVByGenre(genreIds: string, page = 1) {
  return tmdbFetch<TVListResponse>("/discover/tv", {
    with_genres: genreIds,
    sort_by: "popularity.desc",
    page: String(page),
    include_adult: "false",
  });
}

export async function getTVDetails(id: number) {
  return tmdbFetch<TVDetailsWithExtras>(`/tv/${id}`, {
    append_to_response: "credits,watch/providers",
  });
}

export interface ShowcasePoster {
  title: string;
  posterUrl: string;
}

export async function getShowcasePosters(
  count = 10,
  size: "w342" | "w500" = "w342",
): Promise<ShowcasePoster[]> {
  try {
    const url = new URL(`${TMDB_BASE_URL}/trending/movie/week`);
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_API_READ_KEY}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return [];

    const data = (await response.json()) as {
      results: Array<{ title?: string; poster_path: string | null }>;
    };

    return data.results
      .filter((m) => m.poster_path != null)
      .slice(0, count)
      .map((m) => ({
        title: m.title ?? "",
        posterUrl: `https://image.tmdb.org/t/p/${size}${m.poster_path}`,
      }));
  } catch {
    return [];
  }
}

export async function getHeroBackdrop(): Promise<string | null> {
  try {
    const url = new URL(`${TMDB_BASE_URL}/trending/movie/week`);
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_API_READ_KEY}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { results: Array<{ backdrop_path: string | null }> };
    const movie = data.results.find((m) => m.backdrop_path != null);
    if (!movie?.backdrop_path) return null;

    return `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`;
  } catch {
    return null;
  }
}
