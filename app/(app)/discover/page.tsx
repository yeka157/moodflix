import type { Metadata } from "next";
import { DiscoverGridContent } from "@/components/movies/discover-grid-content";

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Browse movies by genre, release year, and more. Filter and discover your next favorite film.",
  openGraph: {
    title: "Discover Movies on Moodflix",
    description:
      "Browse movies by genre, release year, and more. Filter and discover your next favorite film.",
  },
};

export default function DiscoverPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Discover</h1>
        <p className="text-muted-foreground">Find your next favorite movie</p>
      </div>

      <DiscoverGridContent />
    </div>
  );
}
