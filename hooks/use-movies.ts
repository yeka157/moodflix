"use client";

import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type {
  MovieListResponse,
  MovieCategory,
  MovieDetailsResponse,
} from "@/types/movie";

export type DiscoverMoviesParams = {
  genreId: string;
  sortBy: string;
  year: string;
};

export const movieKeys = {
  all: ["movies"] as const,
  category: (cat: MovieCategory, page: number) =>
    [...movieKeys.all, "category", cat, page] as const,
  search: (query: string, page?: number) =>
    [
      ...movieKeys.all,
      "search",
      query,
      ...(page != null ? [page] : []),
    ] as const,
  details: (id: number) => [...movieKeys.all, "details", id] as const,
  genre: (genreIds: string) => [...movieKeys.all, "genre", genreIds] as const,
  discover: (params: DiscoverMoviesParams) =>
    [...movieKeys.all, "discover", params] as const,
  recommendations: (id: number) =>
    [...movieKeys.all, "recommendations", id] as const,
};

async function fetchMovieCategory(
  category: MovieCategory,
  page: number,
): Promise<MovieListResponse> {
  const res = await fetch(`/api/movies?category=${category}&page=${page}`);
  if (!res.ok) throw new Error("Failed to fetch movies");
  return res.json();
}

async function fetchMovieSearch(
  query: string,
  page: number,
): Promise<MovieListResponse> {
  const res = await fetch(
    `/api/movies?query=${encodeURIComponent(query)}&page=${page}`,
  );
  if (!res.ok) throw new Error("Failed to search movies");
  return res.json();
}

async function fetchMovieDetails(id: number): Promise<MovieDetailsResponse> {
  const res = await fetch(`/api/movies/${id}`);
  if (!res.ok) throw new Error("Failed to fetch movie details");
  return res.json();
}

async function fetchGenreDiscover(
  genreIds: string,
  page: number,
): Promise<MovieListResponse> {
  const res = await fetch(
    `/api/movies?genre=${encodeURIComponent(genreIds)}&page=${page}`,
  );
  if (!res.ok) throw new Error("Failed to discover movies by genre");
  return res.json();
}

// Maps decade values like "2020s" to year_start/year_end params
function buildYearParams(year: string): string {
  if (!year) return "";
  const decadeMatch = year.match(/^(\d{4})s$/);
  if (decadeMatch) {
    const start = decadeMatch[1];
    const end = String(Number(start) + 9);
    return `&year_start=${start}&year_end=${end}`;
  }
  return `&year=${encodeURIComponent(year)}`;
}

async function fetchDiscover(
  params: DiscoverMoviesParams,
  page: number,
): Promise<MovieListResponse> {
  const genreParam = params.genreId
    ? `&genre=${encodeURIComponent(params.genreId)}`
    : "";
  const sortParam = params.sortBy
    ? `&sort_by=${encodeURIComponent(params.sortBy)}`
    : "";
  const yearParam = buildYearParams(params.year);
  const res = await fetch(
    `/api/movies?action=discover&page=${page}${genreParam}${sortParam}${yearParam}`,
  );
  if (!res.ok) throw new Error("Failed to discover movies");
  return res.json();
}

export function useTrendingMovies(page = 1) {
  return useQuery({
    queryKey: movieKeys.category("trending", page),
    queryFn: () => fetchMovieCategory("trending", page),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function usePopularMovies(page = 1) {
  return useQuery({
    queryKey: movieKeys.category("popular", page),
    queryFn: () => fetchMovieCategory("popular", page),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useTopRatedMovies(page = 1) {
  return useQuery({
    queryKey: movieKeys.category("top_rated", page),
    queryFn: () => fetchMovieCategory("top_rated", page),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function useMovieSearch(query: string, page = 1) {
  return useQuery({
    queryKey: movieKeys.search(query, page),
    queryFn: () => fetchMovieSearch(query, page),
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useMovieDetails(id: number | null) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: movieKeys.details(id!),
    queryFn: () => fetchMovieDetails(id!),
    enabled: id !== null,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    placeholderData: () => {
      if (id === null) return undefined;
      const queries = queryClient.getQueriesData<MovieListResponse>({
        queryKey: movieKeys.all,
      });
      for (const [, data] of queries) {
        const found = data?.results?.find((m) => m.id === id);
        if (found) return found as unknown as MovieDetailsResponse;
      }
      return undefined;
    },
  });
}

export function useDiscoverByGenre(genreIds: string) {
  return useInfiniteQuery({
    queryKey: movieKeys.genre(genreIds),
    queryFn: ({ pageParam }) => fetchGenreDiscover(genreIds, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    enabled: genreIds.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useDiscoverMovies(params: DiscoverMoviesParams) {
  return useInfiniteQuery({
    queryKey: movieKeys.discover(params),
    queryFn: ({ pageParam }) => fetchDiscover(params, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

async function fetchMovieRecommendations(
  movieId: number,
): Promise<MovieListResponse> {
  const res = await fetch(`/api/movies/${movieId}/recommendations`);
  if (!res.ok) throw new Error("Failed to fetch recommendations");
  return res.json();
}

export function useMovieRecommendations(movieId: number | null) {
  return useQuery({
    queryKey: movieKeys.recommendations(movieId!),
    queryFn: () => fetchMovieRecommendations(movieId!),
    enabled: movieId !== null,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useMovieSearchInfinite(query: string) {
  return useInfiniteQuery({
    queryKey: [...movieKeys.search(query), "infinite"],
    queryFn: ({ pageParam }) => fetchMovieSearch(query, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
