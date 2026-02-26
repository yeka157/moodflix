import type { Metadata } from "next";
import { getTrendingTV, discoverKoreanDramas, discoverChineseDramas, getTopRatedTV } from "@/lib/tmdb";
import { normalizeTVShow } from "@/types/tv";
import { SeriesContent } from "@/components/series/series-content";
import { SeriesGridContent } from "@/components/series/series-grid-content";

export const metadata: Metadata = {
  title: "Series",
  description:
    "Browse and filter TV shows by genre, release year, and more.",
};

export default async function SeriesPage() {
  const [trendingRes, koreanRes, chineseRes, topRatedRes] = await Promise.all([
    getTrendingTV().catch(() => ({ results: [], page: 1, total_pages: 0, total_results: 0 })),
    discoverKoreanDramas().catch(() => ({ results: [], page: 1, total_pages: 0, total_results: 0 })),
    discoverChineseDramas().catch(() => ({ results: [], page: 1, total_pages: 0, total_results: 0 })),
    getTopRatedTV().catch(() => ({ results: [], page: 1, total_pages: 0, total_results: 0 })),
  ]);

  const trending = trendingRes.results.map(normalizeTVShow);
  const korean = koreanRes.results.map(normalizeTVShow);
  const chinese = chineseRes.results.map(normalizeTVShow);
  const topRated = topRatedRes.results.map(normalizeTVShow);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Series</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover TV shows filtered by genre, year, and popularity
        </p>
      </div>

      <SeriesContent
        trending={trending}
        korean={korean}
        chinese={chinese}
        topRated={topRated}
      />

      <div className="mt-12 mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Browse All</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Filter and sort all TV shows
        </p>
      </div>

      <SeriesGridContent />
    </div>
  );
}
