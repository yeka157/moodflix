import type { Metadata } from "next";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  getCachedTrending,
  getCachedTrendingTV,
  getCachedUpcoming,
  getCachedOnTheAirTV,
} from "@/lib/tmdb-cache";
import { getPopularMoviesInRegion } from "@/lib/tmdb";
import { normalizeTVShow } from "@/types/tv";
import { getCountryFromHeaders } from "@/lib/country";
import { getPersonalizedData } from "@/lib/recommendations";
import { getWatchlistStats } from "@/actions/watchlist";
import { HeroBanner } from "@/components/movies/hero-banner";
import { HomeMovies } from "@/components/movies/home-movies";
import { MoodSection } from "@/components/ai/mood-section";
import { WelcomeStats } from "@/components/movies/welcome-stats";
import { CollectionsBento } from "@/components/movies/collections-bento";

export const metadata: Metadata = {
  title: "Home",
  openGraph: {
    title: "Moodflix - AI Movie Discovery",
    description:
      "Discover movies that match your mood with AI-powered recommendations.",
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName = user?.email?.split("@")[0] || "explorer";

  const headersList = await headers();
  const country = getCountryFromHeaders(headersList);

  const [
    trending,
    trendingTV,
    upcomingRes,
    onTheAirTVRes,
    personalizedData,
    stats,
  ] = await Promise.all([
    getCachedTrending(),
    getCachedTrendingTV().catch(() => ({
      results: [],
      page: 1,
      total_pages: 0,
      total_results: 0,
    })),
    getCachedUpcoming(1, country).catch(() => ({
      results: [],
      page: 1,
      total_pages: 0,
      total_results: 0,
    })),
    getCachedOnTheAirTV(1).catch(() => ({
      results: [],
      page: 1,
      total_pages: 0,
      total_results: 0,
    })),
    user ? getPersonalizedData(user.id) : Promise.resolve(null),
    user
      ? getWatchlistStats()
      : Promise.resolve({ inLibrary: 0, watched: 0, thisYear: 0 }),
  ]);

  const trendingTVMovies = trendingTV.results.map(normalizeTVShow);
  const onTheAirTVMovies = onTheAirTVRes.results.map(normalizeTVShow);

  const regionalPopular = !personalizedData
    ? await getPopularMoviesInRegion(country)
    : null;

  const moviesWithBackdrop = trending.results.filter((m) => m.backdrop_path);
  const featuredMovie = moviesWithBackdrop[0];
  const marqueeMovies = trending.results.slice(0, 12);
  const bentoSource = moviesWithBackdrop.slice(1, 8);

  return (
    <div className="page">
      {featuredMovie && (
        <HeroBanner movie={featuredMovie} marqueeMovies={marqueeMovies} index={1} />
      )}

      <WelcomeStats
        displayName={displayName}
        inLibrary={stats.inLibrary}
        watched={stats.watched}
        thisYear={stats.thisYear}
      />

      <section
        className="section reveal"
        style={{ paddingTop: 24, paddingBottom: 24 }}
      >
        <MoodSection />
      </section>

      <section className="section" style={{ paddingTop: 24 }}>
        <HomeMovies
          trending={trending.results}
          trendingTV={trendingTVMovies}
          upcoming={upcomingRes.results}
          onTheAirTV={onTheAirTVMovies}
          personalizedData={personalizedData}
          regionalPopular={regionalPopular?.results}
        />
      </section>

      {bentoSource.length >= 4 && (
        <CollectionsBento sourceMovies={bentoSource} />
      )}

      <div style={{ paddingBottom: 120 }} />
    </div>
  );
}
