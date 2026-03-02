"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { Movie, PersonalizedData } from "@/types/movie";
import { useMovieRecommendations } from "@/hooks/use-movies";
import { useDiscoverByGenre } from "@/hooks/use-movies";
import { useWatchlistTmdbIds } from "@/hooks/use-watchlist";
import { MovieRow } from "./movie-row";

const ROW_PATTERNS: ((title: string) => string)[] = [
  (title) => `Because you liked ${title}`,
  (title) => `More like ${title}`,
  (title) => `If you loved ${title}`,
  (title) => `Since you enjoyed ${title}`,
  (title) => `Fans of ${title} also watch`,
  (title) => `Picked for you — inspired by ${title}`,
];

interface PersonalizedSectionProps {
  data: PersonalizedData;
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
        <div className="size-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(251,44,54,0.12)]">
          <Sparkles className="size-4 text-primary" />
        </div>
        <p className="text-lg text-muted-foreground italic">
          {data.moodMessage}
        </p>
      </motion.div>

      {data.sourceMovies[0] && (rec0.isLoading || rec0Movies.length > 0) && (
        <MovieRow
          title={ROW_PATTERNS[data.rowPatternIndex % ROW_PATTERNS.length](data.sourceMovies[0].title)}
          movies={rec0Movies}
          isLoading={rec0.isLoading}
          isUpdating={rec0.isPlaceholderData}
          mediaType="movie"
        />
      )}

      {data.sourceMovies[1] && (rec1.isLoading || rec1Movies.length > 0) && (
        <MovieRow
          title={ROW_PATTERNS[(data.rowPatternIndex + 1) % ROW_PATTERNS.length](data.sourceMovies[1].title)}
          movies={rec1Movies}
          isLoading={rec1.isLoading}
          isUpdating={rec1.isPlaceholderData}
          mediaType="movie"
        />
      )}

      {(genreDiscover.isLoading || filteredGenreMovies.length > 0) && (
        <MovieRow
          title={`Top ${data.topGenreName} Picks for You`}
          movies={filteredGenreMovies}
          isLoading={genreDiscover.isLoading}
          isUpdating={genreDiscover.isPlaceholderData}
          mediaType="movie"
        />
      )}
    </div>
  );
}
