import type { Metadata } from "next";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Home",
};
import { getTrendingMovies, getPopularMoviesInRegion } from "@/lib/tmdb";
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
  const [trending, personalizedData] = await Promise.all([
    getTrendingMovies(),
    user ? getPersonalizedData(user.id) : Promise.resolve(null),
  ]);

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
      href: "/watchlist",
      icon: "Bookmark",
      title: "Your Watchlist",
      description:
        "Track movies you want to watch and ones you've finished",
    },
  ];

  return (
    <div className="space-y-10">
      {featuredMovie && <HeroBanner movie={featuredMovie} />}

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">{displayName}</p>
      </div>

      <MoodSection />

      <HomeMovies
        trending={trending.results}
        personalizedData={personalizedData}
        regionalPopular={regionalPopular?.results}
      />

      <FeatureCardGrid cards={featureCards} />
    </div>
  );
}
