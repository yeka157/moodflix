import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { MovieShowcase } from "@/components/landing/movie-showcase";
import { AIPreviewSection } from "@/components/landing/ai-preview-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Moodflix - AI-Powered Movie Discovery",
  description:
    "Discover movies that match your mood with AI-powered recommendations. Build your library, explore trending films, and find your next favorite movie.",
  openGraph: {
    title: "Moodflix - AI-Powered Movie Discovery",
    description:
      "Discover movies that match your mood with AI-powered recommendations. Build your library, explore trending films, and find your next favorite movie.",
  },
};

export default function Home() {
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
      <HeroSection />
      <FeaturesSection />
      <MovieShowcase />
      <AIPreviewSection />
      <CTASection />
      <Footer />
    </>
  );
}
