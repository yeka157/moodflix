import type { MovieListResponse, MovieDetailsWithExtras } from "@/types/movie";

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
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
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
