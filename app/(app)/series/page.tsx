import type { Metadata } from "next";
import { SeriesGridContent } from "@/components/series/series-grid-content";

export const metadata: Metadata = {
  title: "Series",
  description:
    "Browse and filter TV shows by genre, release year, and more.",
};

export default function SeriesPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Series</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover TV shows filtered by genre, year, and popularity
        </p>
      </div>
      <SeriesGridContent />
    </div>
  );
}
