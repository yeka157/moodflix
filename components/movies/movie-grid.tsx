"use client";

import { motion } from "framer-motion";
import type { Movie } from "@/types/movie";
import { MovieCard } from "./movie-card";
import { MovieCardSkeleton } from "./movie-card-skeleton";

interface MovieGridProps {
  movies: Movie[];
  isLoading?: boolean;
  onMovieClick?: (movie: Movie) => void;
  sentinelRef?: ((node: HTMLDivElement | null) => void) | React.RefObject<HTMLDivElement | null>;
  isFetchingMore?: boolean;
}

export function MovieGrid({ movies, isLoading = false, onMovieClick, sentinelRef, isFetchingMore }: MovieGridProps) {
  if (isLoading) {
    return (
      // Columns: 2 (375px) | 3 (640px) | 4 (768px) | 5 (1024px) | 6 (1280px+) — WCAG verified
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Columns: 2 (375px) | 3 (640px) | 4 (768px) | 5 (1024px) | 6 (1280px+) — WCAG verified */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {movies.map((movie) => (
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <MovieCard movie={movie} onClick={onMovieClick} />
          </motion.div>
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      {sentinelRef && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {isFetchingMore && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
              {Array.from({ length: 6 }).map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
