"use client";

import { useState } from "react";
import type { Movie, PersonalizedData } from "@/types/movie";
import { MovieRow } from "./movie-row";
import { MovieDetailModal } from "./movie-detail-modal";
import { PersonalizedSection } from "./personalized-section";

interface HomeMoviesProps {
  trending: Movie[];
  personalizedData?: PersonalizedData | null;
  regionalPopular?: Movie[];
}

export function HomeMovies({
  trending,
  personalizedData,
  regionalPopular,
}: HomeMoviesProps) {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  return (
    <>
      <MovieRow
        title="Trending This Week"
        movies={trending}
        onMovieClick={setSelectedMovie}
      />

      {personalizedData && (
        <PersonalizedSection
          data={personalizedData}
          onMovieClick={setSelectedMovie}
        />
      )}

      {!personalizedData && regionalPopular && regionalPopular.length > 0 && (
        <MovieRow
          title="Popular in Your Region"
          movies={regionalPopular}
          onMovieClick={setSelectedMovie}
        />
      )}

      <MovieDetailModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </>
  );
}
