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
    <div className="space-y-16">
      <MovieRow
        eyebrowId="TRENDING / 24h"
        title={
          <>
            Most <span className="it">talked about</span>
          </>
        }
        movies={trending.slice(0, 12)}
        mediaType="movie"
        showRank
      />

      {trendingTV.length > 0 && (
        <MovieRow
          eyebrowId="SERIES / NEW SEASONS"
          title={
            <>
              The <span className="it">small</span> screen
            </>
          }
          movies={trendingTV}
          mediaType="tv"
        />
      )}

      {upcoming.length > 0 && (
        <MovieRow
          eyebrowId="UPCOMING / IN THEATERS SOON"
          title={
            <>
              Coming <span className="it">soon</span>
            </>
          }
          movies={upcoming}
          mediaType="movie"
          showReleaseBadge
        />
      )}

      {onTheAirTV.length > 0 && (
        <MovieRow
          eyebrowId="ON AIR / NEW EPISODES"
          title={
            <>
              Currently <span className="it">airing</span>
            </>
          }
          movies={onTheAirTV}
          mediaType="tv"
          showReleaseBadge
        />
      )}

      {personalizedData && <PersonalizedSection data={personalizedData} />}

      {!personalizedData && regionalPopular && regionalPopular.length > 0 && (
        <MovieRow
          eyebrowId="REGIONAL / FOR YOUR AREA"
          title={
            <>
              Popular <span className="it">near you</span>
            </>
          }
          movies={regionalPopular}
          mediaType="movie"
        />
      )}
    </div>
  );
}
