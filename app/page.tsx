import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { MovieShowcase } from "@/components/landing/movie-showcase";
import { AIPreviewSection } from "@/components/landing/ai-preview-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";
import { getHeroBackdrop, getShowcasePosters } from "@/lib/tmdb";
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

export default async function Home() {
  const supabase = await createClient();
  const [{ data: { user } }, backdropUrl, posters] = await Promise.all([
    supabase.auth.getUser(),
    getHeroBackdrop(),
    getShowcasePosters(20, "w500"),
  ]);

  const actionHref = user ? "/home" : "/login";

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
      <LandingNavbar />
      <HeroSection backdropUrl={backdropUrl} actionHref={actionHref} />
      <FeaturesSection />
      <MovieShowcase posters={posters} />
      <AIPreviewSection actionHref={actionHref} />
      <CTASection actionHref={actionHref} />
      <Footer />
    </>
  );
}
