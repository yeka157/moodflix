import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Sparkles } from "lucide-react";
import { discoverMoviesByGenre } from "@/lib/tmdb";
import { GENRES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { RecommendationsGrid } from "@/components/ai/recommendations-grid";

export const metadata: Metadata = {
  title: "AI Recommendations",
};

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<{ genres?: string; mood?: string }>;
}) {
  const { genres, mood } = await searchParams;

  if (!genres) redirect("/home");

  const genreIds = genres.split(",").map(Number).filter(Boolean);
  const genreNames = genreIds
    .map((id) => GENRES[id])
    .filter((name): name is string => Boolean(name));

  const firstPage = await discoverMoviesByGenre(genres);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">
              AI Recommendations
            </h1>
          </div>

          {mood && (
            <p className="text-muted-foreground text-sm max-w-lg">
              Based on your mood: &ldquo;{decodeURIComponent(mood)}&rdquo;
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {genreNames.map((name) => (
              <Badge
                key={name}
                variant="secondary"
                className="bg-primary/15 text-primary border-primary/20"
              >
                {name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Movie grid */}
      <RecommendationsGrid
        genres={genres}
        initialMovies={firstPage.results}
      />
    </div>
  );
}
