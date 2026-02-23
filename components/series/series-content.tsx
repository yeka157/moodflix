"use client";

import { useState } from "react";
import type { Movie } from "@/types/movie";
import { SeriesHeroBanner } from "@/components/series/series-hero-banner";
import { MovieRow } from "@/components/movies/movie-row";
import { MovieDetailModal } from "@/components/movies/movie-detail-modal";

interface SeriesContentProps {
  trending: Movie[];
  airingToday: Movie[];
  korean: Movie[];
  chinese: Movie[];
  topRated: Movie[];
}

export function SeriesContent({
  trending,
  airingToday,
  korean,
  chinese,
  topRated,
}: SeriesContentProps) {
  const [selectedShow, setSelectedShow] = useState<Movie | null>(null);

  const featuredShow =
    trending.find((t) => t.backdrop_path) ?? trending[0] ?? null;

  return (
    <div className="space-y-8">
      {featuredShow && (
        <SeriesHeroBanner
          show={featuredShow}
          onClick={() => setSelectedShow(featuredShow)}
        />
      )}

      <MovieRow
        title="Trending TV Shows"
        movies={trending}
        onMovieClick={setSelectedShow}
      />

      <MovieRow
        title="Airing Today"
        movies={airingToday}
        onMovieClick={setSelectedShow}
      />

      <MovieRow
        title="Korean Drama"
        movies={korean}
        onMovieClick={setSelectedShow}
      />

      <MovieRow
        title="Chinese Drama"
        movies={chinese}
        onMovieClick={setSelectedShow}
      />

      <MovieRow
        title="Top Rated Series"
        movies={topRated}
        onMovieClick={setSelectedShow}
      />

      <MovieDetailModal
        movie={selectedShow}
        onClose={() => setSelectedShow(null)}
        mediaType="tv"
      />
    </div>
  );
}
