import { LandingNavbar } from "@/components/landing/landing-navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { MovieShowcase } from "@/components/landing/movie-showcase";
import { AIPreviewSection } from "@/components/landing/ai-preview-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
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
