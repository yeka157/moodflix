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
    <div className="space-y-16">
      <MovieRow
        eyebrowId="TRENDING / WEEK"
        title={
          <>
            Most <span className="it">watched</span>
          </>
        }
        movies={trending}
        hrefPrefix="/tv/"
        mediaType="tv"
        showRank
      />

      {onTheAir.length > 0 && (
        <MovieRow
          eyebrowId="ON AIR / NEW EPISODES"
          title={
            <>
              Currently <span className="it">airing</span>
            </>
          }
          movies={onTheAir}
          hrefPrefix="/tv/"
          mediaType="tv"
          showReleaseBadge
        />
      )}

      <MovieRow
        eyebrowId="REGION / KOREA"
        title={
          <>
            K-drama <span className="it">specials</span>
          </>
        }
        movies={korean}
        hrefPrefix="/tv/"
        mediaType="tv"
      />

      <MovieRow
        eyebrowId="REGION / CHINA"
        title={
          <>
            C-drama <span className="it">picks</span>
          </>
        }
        movies={chinese}
        hrefPrefix="/tv/"
        mediaType="tv"
      />

      <MovieRow
        eyebrowId="ALL TIME / TOP RATED"
        title={
          <>
            Top rated, <span className="it">all time</span>
          </>
        }
        movies={topRated}
        hrefPrefix="/tv/"
        mediaType="tv"
      />
    </div>
  );
}
