import type { Metadata } from "next";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Home",
  openGraph: {
    title: "Moodflix - AI Movie Discovery",
    description:
      "Discover movies that match your mood with AI-powered recommendations.",
  },
};
import {
  getCachedTrending,
  getCachedTrendingTV,
  getCachedUpcoming,
} from "@/lib/tmdb-cache";
import { getPopularMoviesInRegion } from "@/lib/tmdb";
import { normalizeTVShow } from "@/types/tv";
import { getCountryFromHeaders } from "@/lib/country";
import { getPersonalizedData } from "@/lib/recommendations";
import { HeroBanner } from "@/components/movies/hero-banner";
import { HomeMovies } from "@/components/movies/home-movies";
import { MoodSection } from "@/components/ai/mood-section";
import { FeatureCardGrid } from "@/components/layout/feature-card-grid";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName = user?.email?.split("@")[0] || "Explorer";

  // Fetch trending and personalized data in parallel
  const [trending, trendingTV, upcomingRes, personalizedData] = await Promise.all([
    getCachedTrending(),
    getCachedTrendingTV().catch(() => ({ results: [], page: 1, total_pages: 0, total_results: 0 })),
    getCachedUpcoming().catch(() => ({ results: [], page: 1, total_pages: 0, total_results: 0 })),
    user ? getPersonalizedData(user.id) : Promise.resolve(null),
  ]);

  const trendingTVMovies = trendingTV.results.map(normalizeTVShow);

  // For users without personalized data, fetch regional popular movies
  const headersList = await headers();
  const country = getCountryFromHeaders(headersList);
  const regionalPopular = !personalizedData
    ? await getPopularMoviesInRegion(country)
    : null;

  const moviesWithBackdrop = trending.results.filter((m) => m.backdrop_path);
  const featuredMovie = moviesWithBackdrop[0];

  const featureCards = [
    {
      href: "/discover",
      icon: "Compass",
      title: "Discover Movies",
      description:
        "Browse trending movies and search for your next favorite film",
    },
    {
      href: "/series",
      icon: "Tv",
      title: "Browse Series",
      description: "Explore trending TV shows, K-dramas, and top rated series",
    },
    {
      href: "/library",
      icon: "Bookmark",
      title: "My Library",
      description:
        "Track movies you want to watch and ones you've seen",
    },
  ];

  return (
    <div className="space-y-10">
      {featuredMovie && <HeroBanner movie={featuredMovie} />}

      <div className="px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground">{displayName}</p>
        </div>

        <HomeMovies
          trending={trending.results}
          trendingTV={trendingTVMovies}
          upcoming={upcomingRes.results}
          personalizedData={personalizedData}
          regionalPopular={regionalPopular?.results}
        />

        <MoodSection />

        <FeatureCardGrid cards={featureCards} />
      </div>
    </div>
  );
}
