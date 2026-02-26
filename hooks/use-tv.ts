"use client";

import { useQuery, useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import type { Movie } from "@/types/movie";
import type { TVListResponse, TVDetailsResponse } from "@/types/tv";
import { normalizeTVShow } from "@/types/tv";

export type TVCategory = "trending" | "top_rated" | "airing_today" | "korean_drama" | "chinese_drama";

export type DiscoverTVParams = {
  genreId: string;
  sortBy: string;
  year: string;
};

export const tvKeys = {
  all: ["tv"] as const,
  category: (cat: TVCategory) => [...tvKeys.all, "category", cat] as const,
  details: (id: number) => [...tvKeys.all, "details", id] as const,
  discover: (params: DiscoverTVParams) => [...tvKeys.all, "discover", params] as const,
  genre: (genreIds: string) => [...tvKeys.all, "genre", genreIds] as const,
};

async function fetchTVCategory(category: TVCategory): Promise<Movie[]> {
  const res = await fetch(`/api/tv?category=${category}`);
  if (!res.ok) throw new Error("Failed to fetch TV shows");
  const data: TVListResponse = await res.json();
  return data.results.map(normalizeTVShow);
}

async function fetchTVDetails(id: number): Promise<TVDetailsResponse> {
  const res = await fetch(`/api/tv/${id}`);
  if (!res.ok) throw new Error("Failed to fetch TV details");
  return res.json();
}

// Maps decade values like "2020s" to year_start/year_end params
function buildTVYearParams(year: string): string {
  if (!year) return "";
  const decadeMatch = year.match(/^(\d{4})s$/);
  if (decadeMatch) {
    const start = decadeMatch[1];
    const end = String(Number(start) + 9);
    return `&year_start=${start}&year_end=${end}`;
  }
  return `&year=${encodeURIComponent(year)}`;
}

async function fetchDiscoverTV(params: DiscoverTVParams, page: number): Promise<TVListResponse> {
  const genreParam = params.genreId ? `&genre=${encodeURIComponent(params.genreId)}` : "";
  const sortParam = params.sortBy ? `&sort_by=${encodeURIComponent(params.sortBy)}` : "";
  const yearParam = buildTVYearParams(params.year);
  const res = await fetch(
    `/api/tv?action=discover&page=${page}${genreParam}${sortParam}${yearParam}`,
  );
  if (!res.ok) throw new Error("Failed to discover TV shows");
  return res.json();
}

export function useTrendingTV() {
  return useQuery({
    queryKey: tvKeys.category("trending"),
    queryFn: () => fetchTVCategory("trending"),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useTopRatedTV() {
  return useQuery({
    queryKey: tvKeys.category("top_rated"),
    queryFn: () => fetchTVCategory("top_rated"),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function useKoreanDramas() {
  return useQuery({
    queryKey: tvKeys.category("korean_drama"),
    queryFn: () => fetchTVCategory("korean_drama"),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useAiringTodayTV() {
  return useQuery({
    queryKey: tvKeys.category("airing_today"),
    queryFn: () => fetchTVCategory("airing_today"),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useChineseDramas() {
  return useQuery({
    queryKey: tvKeys.category("chinese_drama"),
    queryFn: () => fetchTVCategory("chinese_drama"),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useTVDetails(id: number | null) {
  return useQuery({
    queryKey: tvKeys.details(id!),
    queryFn: () => fetchTVDetails(id!),
    enabled: id !== null,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function useDiscoverTV(params: DiscoverTVParams) {
  return useInfiniteQuery({
    queryKey: tvKeys.discover(params),
    queryFn: async ({ pageParam }) => {
      const data = await fetchDiscoverTV(params, pageParam);
      return {
        ...data,
        results: data.results.map(normalizeTVShow),
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

async function fetchTVGenreDiscover(
  genreIds: string,
  page: number,
): Promise<{ page: number; results: Movie[]; total_pages: number; total_results: number }> {
  const res = await fetch(`/api/tv?action=discover&genre=${encodeURIComponent(genreIds)}&page=${page}`);
  if (!res.ok) throw new Error("Failed to discover TV by genre");
  const data: TVListResponse = await res.json();
  return { ...data, results: data.results.map(normalizeTVShow) };
}

export function useDiscoverTVByGenre(genreIds: string) {
  return useInfiniteQuery({
    queryKey: tvKeys.genre(genreIds),
    queryFn: ({ pageParam }) => fetchTVGenreDiscover(genreIds, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    enabled: genreIds.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
