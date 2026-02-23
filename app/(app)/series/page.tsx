import type { Metadata } from "next";
import {
  getTrendingTV,
  getTopRatedTV,
  getAiringTodayTV,
  discoverKoreanDramas,
  discoverChineseDramas,
} from "@/lib/tmdb";
import { normalizeTVShow } from "@/types/tv";
import { SeriesContent } from "@/components/series/series-content";

export const metadata: Metadata = {
  title: "Series",
  description:
    "Browse trending and top-rated TV shows, Korean dramas, and Chinese dramas.",
};

export default async function SeriesPage() {
  const [trending, airingToday, topRated, korean, chinese] = await Promise.all([
    getTrendingTV(),
    getAiringTodayTV(),
    getTopRatedTV(),
    discoverKoreanDramas(),
    discoverChineseDramas(),
  ]);

  return (
    <SeriesContent
      trending={trending.results.map(normalizeTVShow)}
      airingToday={airingToday.results.map(normalizeTVShow)}
      topRated={topRated.results.map(normalizeTVShow)}
      korean={korean.results.map(normalizeTVShow)}
      chinese={chinese.results.map(normalizeTVShow)}
    />
  );
}
