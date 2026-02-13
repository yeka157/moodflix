"use client";

import { useState, useMemo } from "react";
import useInfiniteScroll from "react-infinite-scroll-hook";
import type { Movie, MovieListResponse } from "@/types/movie";
import { useDiscoverByGenre } from "@/hooks/use-movies";
import { MovieGrid } from "@/components/movies/movie-grid";
import { MovieDetailModal } from "@/components/movies/movie-detail-modal";

interface RecommendationsGridProps {
  genres: string;
  initialMovies: Movie[];
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
}: RecommendationsGridProps) {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const query = useDiscoverByGenre(genres);

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

  return (
    <>
      <MovieGrid
        movies={movies}
        onMovieClick={setSelectedMovie}
        sentinelRef={sentinelRef}
        isFetchingMore={query.isFetchingNextPage}
      />

      <MovieDetailModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </>
  );
}
