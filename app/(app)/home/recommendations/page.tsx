import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { Movie } from "@/types/movie";
import { discoverMoviesByGenre, discoverTVByGenre } from "@/lib/tmdb";
import { normalizeTVShow } from "@/types/tv";
import { GENRES, TV_GENRES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { RecommendationsGrid } from "@/components/ai/recommendations-grid";

export const metadata: Metadata = {
  title: "AI Recommendations",
  description:
    "AI-powered movie recommendations based on your mood. Discover films curated just for you.",
};

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<{ genres?: string; mood?: string; type?: string }>;
}) {
  const { genres, mood, type } = await searchParams;

  if (!genres) redirect("/home");

  const mediaType = type === "tv" ? "tv" : "movie";
  const genreIds = genres.split(",").map(Number).filter(Boolean);
  const allGenres = { ...GENRES, ...TV_GENRES };
  const genreNames = genreIds
    .map((id) => allGenres[id])
    .filter((name): name is string => Boolean(name));

  let initialMovies: Movie[];
  if (mediaType === "tv") {
    const tvPage = await discoverTVByGenre(genres);
    initialMovies = tvPage.results.map(normalizeTVShow);
  } else {
    const moviePage = await discoverMoviesByGenre(genres);
    initialMovies = moviePage.results;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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

      {/* Grid */}
      <RecommendationsGrid
        genres={genres}
        initialMovies={initialMovies}
        mediaType={mediaType}
      />
    </div>
  );
}
