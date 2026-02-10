"use client";

import { motion } from "framer-motion";
import type { Movie } from "@/types/movie";
import { MovieCard } from "./movie-card";
import { MovieCardSkeleton } from "./movie-card-skeleton";
import type { RefObject } from "react";

interface MovieGridProps {
  movies: Movie[];
  isLoading?: boolean;
  onMovieClick?: (movie: Movie) => void;
  sentinelRef?: RefObject<HTMLDivElement | null>;
  isFetchingMore?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
};

export function MovieGrid({ movies, isLoading = false, onMovieClick, sentinelRef, isFetchingMore }: MovieGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {movies.map((movie) => (
          <motion.div key={movie.id} variants={itemVariants}>
            <MovieCard movie={movie} onClick={onMovieClick} />
          </motion.div>
        ))}
      </motion.div>

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
