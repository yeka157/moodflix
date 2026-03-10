import type { Metadata } from "next";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import {
  getCachedTrendingTV,
  getCachedOnTheAirTV,
  getCachedKoreanDramas,
  getCachedChineseDramas,
  getCachedTopRatedTV,
} from "@/lib/tmdb-cache";
import { normalizeTVShow } from "@/types/tv";
import { tvKeys } from "@/hooks/use-tv";
import { SeriesPageContent } from "@/components/series/series-page-content";

export const metadata: Metadata = {
  title: "Series",
  description:
    "Browse and filter TV shows by genre, release year, and more.",
};

export default async function SeriesPage() {
  const [trendingRes, onTheAirRes, koreanRes, chineseRes, topRatedRes] = await Promise.all([
    getCachedTrendingTV().catch(() => ({ results: [], page: 1, total_pages: 0, total_results: 0 })),
    getCachedOnTheAirTV().catch(() => ({ results: [], page: 1, total_pages: 0, total_results: 0 })),
    getCachedKoreanDramas().catch(() => ({ results: [], page: 1, total_pages: 0, total_results: 0 })),
    getCachedChineseDramas().catch(() => ({ results: [], page: 1, total_pages: 0, total_results: 0 })),
    getCachedTopRatedTV().catch(() => ({ results: [], page: 1, total_pages: 0, total_results: 0 })),
  ]);

  const trending = trendingRes.results.map(normalizeTVShow);
  const onTheAir = onTheAirRes.results.map(normalizeTVShow);
  const korean = koreanRes.results.map(normalizeTVShow);
  const chinese = chineseRes.results.map(normalizeTVShow);
  const topRated = topRatedRes.results.map(normalizeTVShow);

  // Seed TanStack Query cache with SSR data for stale-while-revalidate on return visits
  const queryClient = new QueryClient();
  queryClient.setQueryData(tvKeys.category("trending"), trending);
  queryClient.setQueryData(tvKeys.category("top_rated"), topRated);
  queryClient.setQueryData(tvKeys.category("korean_drama"), korean);
  queryClient.setQueryData(tvKeys.category("chinese_drama"), chinese);
  queryClient.setQueryData(tvKeys.category("airing_today"), onTheAir);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Series</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover TV shows filtered by genre, year, and popularity
        </p>
      </div>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <SeriesPageContent
          trending={trending}
          onTheAir={onTheAir}
          korean={korean}
          chinese={chinese}
          topRated={topRated}
        />
      </HydrationBoundary>
    </div>
  );
}
