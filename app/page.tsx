import type { Metadata } from "next";
import {
  LandingRevamp,
  type LandingMovie,
} from "@/components/landing/landing-revamp";
import { getTrendingMovies } from "@/lib/tmdb";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Moodflix — Discover Movies That Match Your Mood",
  description:
    "Tell our AI how you're feeling and get personalized movie recommendations instantly. Browse thousands of titles with TMDB, build your personal watchlist, and never miss a great film.",
  openGraph: {
    title: "Moodflix — Discover Movies That Match Your Mood",
    description:
      "Tell our AI how you're feeling and get personalized movie recommendations instantly. Browse thousands of titles with TMDB, build your personal watchlist, and never miss a great film.",
  },
};

const POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";
const FALLBACK_BACKDROP = "/placeholder-backdrop.svg";
const FALLBACK_POSTER = "/placeholder-poster.svg";

export default async function Home() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    trending,
  ] = await Promise.all([
    supabase.auth.getUser(),
    getTrendingMovies().catch(() => null),
  ]);

  const actionHref = user ? "/home" : "/login";

  const movies: LandingMovie[] = (trending?.results ?? [])
    .filter((m) => m.poster_path && m.backdrop_path)
    .slice(0, 24)
    .map((m) => ({
      id: m.id,
      title: m.title,
      year: m.release_date ? m.release_date.slice(0, 4) : "",
      posterUrl: m.poster_path
        ? `${POSTER_BASE}${m.poster_path}`
        : FALLBACK_POSTER,
      backdropUrl: m.backdrop_path
        ? `${BACKDROP_BASE}${m.backdrop_path}`
        : FALLBACK_BACKDROP,
    }));

  const heroBackdropUrl = movies[0]?.backdropUrl ?? FALLBACK_BACKDROP;
  const finalBackdropUrl =
    movies[7]?.backdropUrl ?? movies[0]?.backdropUrl ?? FALLBACK_BACKDROP;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Moodflix",
    description:
      "AI-powered movie library and mood-based discovery platform.",
    url: "https://moodflix.app",
    applicationCategory: "EntertainmentApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Organization",
      name: "Moodflix",
      url: "https://moodflix.app",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingRevamp
        actionHref={actionHref}
        heroBackdropUrl={heroBackdropUrl}
        finalBackdropUrl={finalBackdropUrl}
        movies={movies}
      />
    </>
  );
}
