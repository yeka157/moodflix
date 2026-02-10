"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import type {
  MovieListResponse,
  MovieCategory,
  MovieDetailsResponse,
} from "@/types/movie";

export const movieKeys = {
  all: ["movies"] as const,
  category: (cat: MovieCategory, page: number) =>
    [...movieKeys.all, "category", cat, page] as const,
  search: (query: string) =>
    [...movieKeys.all, "search", query] as const,
  details: (id: number) =>
    [...movieKeys.all, "details", id] as const,
  genre: (genreIds: string) =>
    [...movieKeys.all, "genre", genreIds] as const,
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

async function fetchMovieDetails(
  id: number,
): Promise<MovieDetailsResponse> {
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

export function useTrendingMovies(page = 1) {
  return useQuery({
    queryKey: movieKeys.category("trending", page),
    queryFn: () => fetchMovieCategory("trending", page),
  });
}

export function usePopularMovies(page = 1) {
  return useQuery({
    queryKey: movieKeys.category("popular", page),
    queryFn: () => fetchMovieCategory("popular", page),
  });
}

export function useTopRatedMovies(page = 1) {
  return useQuery({
    queryKey: movieKeys.category("top_rated", page),
    queryFn: () => fetchMovieCategory("top_rated", page),
  });
}

export function useMovieSearch(query: string, page = 1) {
  return useQuery({
    queryKey: [...movieKeys.search(query), page],
    queryFn: () => fetchMovieSearch(query, page),
    enabled: query.length >= 2,
    placeholderData: (previousData: MovieListResponse | undefined) =>
      previousData,
  });
}

export function useMovieDetails(id: number | null) {
  return useQuery({
    queryKey: movieKeys.details(id!),
    queryFn: () => fetchMovieDetails(id!),
    enabled: id !== null,
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
  });
}
