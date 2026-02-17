"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { Movie, PersonalizedData } from "@/types/movie";
import { useMovieRecommendations } from "@/hooks/use-movies";
import { useDiscoverByGenre } from "@/hooks/use-movies";
import { useWatchlistTmdbIds } from "@/hooks/use-watchlist";
import { MovieRow } from "./movie-row";

interface PersonalizedSectionProps {
  data: PersonalizedData;
  onMovieClick: (movie: Movie) => void;
}

function filterMovies(movies: Movie[], excludeIds: Set<number>): Movie[] {
  const seen = new Set<number>();
  return movies.filter((m) => {
    if (excludeIds.has(m.id) || seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}

export function PersonalizedSection({
  data,
  onMovieClick,
}: PersonalizedSectionProps) {
  const rec0 = useMovieRecommendations(data.sourceMovies[0]?.tmdbId ?? null);
  const rec1 = useMovieRecommendations(data.sourceMovies[1]?.tmdbId ?? null);

  const genreDiscover = useDiscoverByGenre(String(data.topGenreId));
  const genreMovies = genreDiscover.data?.pages?.[0]?.results ?? [];

  const { data: watchlistIds } = useWatchlistTmdbIds();
  const excludeSet = useMemo(
    () => new Set(watchlistIds?.map((entry) => entry.tmdbId) ?? []),
    [watchlistIds],
  );

  const rec0Movies = filterMovies(rec0.data?.results ?? [], excludeSet);
  const rec1Movies = filterMovies(rec1.data?.results ?? [], excludeSet);
  const filteredGenreMovies = filterMovies(genreMovies, excludeSet);

  return (
    <div className="space-y-8">
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="size-4 text-primary" />
        </div>
        <p className="text-lg text-muted-foreground italic">
          {data.moodMessage}
        </p>
      </motion.div>

      {data.sourceMovies[0] && (rec0.isLoading || rec0Movies.length > 0) && (
        <MovieRow
          title={`Because you liked ${data.sourceMovies[0].title}`}
          movies={rec0Movies}
          isLoading={rec0.isLoading}
          isUpdating={rec0.isPlaceholderData}
          onMovieClick={onMovieClick}
        />
      )}

      {data.sourceMovies[1] && (rec1.isLoading || rec1Movies.length > 0) && (
        <MovieRow
          title={`Because you liked ${data.sourceMovies[1].title}`}
          movies={rec1Movies}
          isLoading={rec1.isLoading}
          isUpdating={rec1.isPlaceholderData}
          onMovieClick={onMovieClick}
        />
      )}

      {(genreDiscover.isLoading || filteredGenreMovies.length > 0) && (
        <MovieRow
          title={`Top ${data.topGenreName} Picks for You`}
          movies={filteredGenreMovies}
          isLoading={genreDiscover.isLoading}
          isUpdating={genreDiscover.isPlaceholderData}
          onMovieClick={onMovieClick}
        />
      )}
    </div>
  );
}
