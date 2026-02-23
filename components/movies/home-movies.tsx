"use client";

import type { Movie, PersonalizedData } from "@/types/movie";
import { MovieRow } from "./movie-row";
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
  return (
    <>
      <MovieRow
        title="Trending This Week"
        movies={trending}
        mediaType="movie"
      />

      {personalizedData && (
        <PersonalizedSection
          data={personalizedData}
        />
      )}

      {!personalizedData && regionalPopular && regionalPopular.length > 0 && (
        <MovieRow
          title="Popular in Your Region"
          movies={regionalPopular}
          mediaType="movie"
        />
      )}
    </>
  );
}
