"use client";

import { useMemo } from "react";
import useInfiniteScroll from "react-infinite-scroll-hook";
import type { Movie, MovieListResponse } from "@/types/movie";
import { useDiscoverByGenre } from "@/hooks/use-movies";
import { useDiscoverTVByGenre } from "@/hooks/use-tv";
import { MovieGrid } from "@/components/movies/movie-grid";

interface RecommendationsGridProps {
  genres: string;
  initialMovies: Movie[];
  mediaType?: "movie" | "tv";
  originCountry?: string;
}

function dedupeMovies(pages: MovieListResponse[] | undefined): Movie[] {
  if (!pages) return [];
  const seen = new Set<number>();
  const result: Movie[] = [];
  for (const page of pages) {
    for (const movie of page.results) {
      if (!seen.has(movie.id)) {
        seen.add(movie.id);
        result.push(movie);
      }
    }
  }
  return result;
}

export function RecommendationsGrid({
  genres,
  initialMovies,
  mediaType = "movie",
  originCountry,
}: RecommendationsGridProps) {
  const movieQuery = useDiscoverByGenre(mediaType === "movie" ? genres : "", originCountry);
  const tvQuery = useDiscoverTVByGenre(mediaType === "tv" ? genres : "", originCountry);
  const query = mediaType === "tv" ? tvQuery : movieQuery;

  const movies = useMemo(() => {
    const fromQuery = dedupeMovies(query.data?.pages);
    if (fromQuery.length > 0) return fromQuery;
    return initialMovies;
  }, [query.data?.pages, initialMovies]);

  const [sentinelRef] = useInfiniteScroll({
    loading: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    onLoadMore: query.fetchNextPage,
    disabled: Boolean(query.error),
  });

  const hrefPrefix = mediaType === "tv" ? "/tv/" : "/movie/";

  return (
    <MovieGrid
      movies={movies}
      hrefPrefix={hrefPrefix}
      sentinelRef={sentinelRef}
      isFetchingMore={query.isFetchingNextPage}
    />
  );
}
