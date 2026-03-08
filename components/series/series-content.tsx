import type { Movie } from "@/types/movie";
import { MovieRow } from "@/components/movies/movie-row";

interface SeriesContentProps {
  trending: Movie[];
  onTheAir?: Movie[];
  korean: Movie[];
  chinese: Movie[];
  topRated: Movie[];
}

export function SeriesContent({
  trending,
  onTheAir = [],
  korean,
  chinese,
  topRated,
}: SeriesContentProps) {
  return (
    <div className="space-y-8">
      <MovieRow
        title="Trending TV Shows"
        movies={trending}
        hrefPrefix="/tv/"
        mediaType="tv"
      />

      {onTheAir.length > 0 && (
        <MovieRow
          title="Currently Airing"
          movies={onTheAir}
          hrefPrefix="/tv/"
          mediaType="tv"
          showReleaseBadge
        />
      )}

      <MovieRow
        title="Korean Drama"
        movies={korean}
        hrefPrefix="/tv/"
        mediaType="tv"
      />

      <MovieRow
        title="Chinese Drama"
        movies={chinese}
        hrefPrefix="/tv/"
        mediaType="tv"
      />

      <MovieRow
        title="Top Rated Series"
        movies={topRated}
        hrefPrefix="/tv/"
        mediaType="tv"
      />
    </div>
  );
}
