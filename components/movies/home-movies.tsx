"use client";

import type { Movie, PersonalizedData } from "@/types/movie";
import { MovieRow } from "./movie-row";
import { PersonalizedSection } from "./personalized-section";

interface HomeMoviesProps {
  trending: Movie[];
  trendingTV?: Movie[];
  upcoming?: Movie[];
  onTheAirTV?: Movie[];
  personalizedData?: PersonalizedData | null;
  regionalPopular?: Movie[];
}

export function HomeMovies({
  trending,
  trendingTV = [],
  upcoming = [],
  onTheAirTV = [],
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

      {trendingTV.length > 0 && (
        <MovieRow
          title="Trending TV Shows"
          movies={trendingTV}
          mediaType="tv"
        />
      )}

      {upcoming.length > 0 && (
        <MovieRow
          title="Upcoming Movies"
          movies={upcoming}
          mediaType="movie"
          showReleaseBadge
        />
      )}

      {onTheAirTV.length > 0 && (
        <MovieRow
          title="Currently Airing TV Series"
          movies={onTheAirTV}
          mediaType="tv"
          showReleaseBadge
        />
      )}

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
