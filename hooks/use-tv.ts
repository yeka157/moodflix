"use client";

import { useQuery } from "@tanstack/react-query";
import type { Movie } from "@/types/movie";
import type { TVListResponse, TVDetailsResponse } from "@/types/tv";
import { normalizeTVShow } from "@/types/tv";

export type TVCategory = "trending" | "top_rated" | "airing_today" | "korean_drama" | "chinese_drama";

export const tvKeys = {
  all: ["tv"] as const,
  category: (cat: TVCategory) => [...tvKeys.all, "category", cat] as const,
  details: (id: number) => [...tvKeys.all, "details", id] as const,
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
