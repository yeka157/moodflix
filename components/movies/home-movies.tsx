"use client";

import { useState } from "react";
import type { Movie } from "@/types/movie";
import { MovieRow } from "./movie-row";
import { MovieDetailModal } from "./movie-detail-modal";

interface HomeMoviesProps {
  trending: Movie[];
}

export function HomeMovies({ trending }: HomeMoviesProps) {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  return (
    <>
      <MovieRow
        title="Trending This Week"
        movies={trending}
        onMovieClick={setSelectedMovie}
      />

      <MovieDetailModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </>
  );
}
