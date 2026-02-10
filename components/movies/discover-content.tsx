"use client";

import { useState, useMemo } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import type { Movie, MovieListResponse } from "@/types/movie";
import {
  useMovieSearchInfinite,
  useDiscoverByGenre,
} from "@/hooks/use-movies";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { GENRES } from "@/lib/constants";
import { MovieRow } from "./movie-row";
import { MovieGrid } from "./movie-grid";
import { MovieDetailModal } from "./movie-detail-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface DiscoverContentProps {
  trending: Movie[];
  popular: Movie[];
  topRated: Movie[];
}

const GENRE_ENTRIES = Object.entries(GENRES).map(([id, name]) => ({
  id,
  name,
}));

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

export function DiscoverContent({
  trending,
  popular,
  topRated,
}: DiscoverContentProps) {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const debouncedSetQuery = useDebouncedCallback((value: string) => {
    setDebouncedQuery(value);
  }, 300);

  const genreParam = selectedGenres.join(",");

  const searchQuery = useMovieSearchInfinite(debouncedQuery);
  const genreQuery = useDiscoverByGenre(genreParam);

  const isSearchActive = debouncedQuery.length >= 2;
  const isGenreActive = selectedGenres.length > 0 && !isSearchActive;

  const searchMovies = useMemo(
    () => dedupeMovies(searchQuery.data?.pages),
    [searchQuery.data],
  );
  const searchTotal = searchQuery.data?.pages[0]?.total_results ?? 0;

  const genreMovies = useMemo(
    () => dedupeMovies(genreQuery.data?.pages),    [genreQuery.data],
  );

  const searchSentinelRef = useInfiniteScroll(
    searchQuery.fetchNextPage,
    searchQuery.hasNextPage,
    searchQuery.isFetchingNextPage,
  );

  const genreSentinelRef = useInfiniteScroll(
    genreQuery.fetchNextPage,
    genreQuery.hasNextPage,
    genreQuery.isFetchingNextPage,
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSetQuery(value);
  };

  const handleClear = () => {
    setInputValue("");
    setDebouncedQuery("");
  };

  return (
    <div className="space-y-8">
      {/* Search bar */}
      <div className="max-w-xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for movies..."
            value={inputValue}
            onChange={handleInputChange}
            className="h-12 text-base pl-10 pr-10"
          />
          {inputValue && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10"
              onClick={handleClear}
              disabled={searchQuery.isFetching}
            >
              {searchQuery.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Genre filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            Filter by Genre
          </h3>
          {selectedGenres.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedGenres([])}
            >
              Clear all
            </Button>
          )}
        </div>
        <div className="overflow-x-auto scrollbar-hide pb-1">
          <ToggleGroup
            type="multiple"
            value={selectedGenres}
            onValueChange={setSelectedGenres}
            className="flex flex-wrap gap-2"
          >
            {GENRE_ENTRIES.map((genre) => (
              <ToggleGroupItem
                key={genre.id}
                value={genre.id}
                variant="outline"
                size="sm"
                className="h-8 text-xs px-3 rounded-full"
              >
                {genre.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      {/* Content */}
      {isSearchActive ? (
        <div className="space-y-6">
          {searchQuery.isLoading ? (
            <MovieGrid movies={[]} isLoading />
          ) : searchMovies.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Found {searchTotal.toLocaleString()} results
              </p>
              <MovieGrid
                movies={searchMovies}
                onMovieClick={setSelectedMovie}
                sentinelRef={searchSentinelRef}
                isFetchingMore={searchQuery.isFetchingNextPage}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No movies found</h3>
              <p className="text-sm text-muted-foreground">
                Try searching for a different title
              </p>
            </div>
          )}
        </div>
      ) : isGenreActive ? (
        <div className="space-y-6">
          {genreQuery.isLoading ? (
            <MovieGrid movies={[]} isLoading />
          ) : genreMovies.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                {selectedGenres
                  .map((id) => GENRES[Number(id)])
                  .join(" + ")}{" "}
                movies
              </p>
              <MovieGrid
                movies={genreMovies}
                onMovieClick={setSelectedMovie}
                sentinelRef={genreSentinelRef}
                isFetchingMore={genreQuery.isFetchingNextPage}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No movies found</h3>
              <p className="text-sm text-muted-foreground">
                Try selecting different genres
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <MovieRow
            title="Trending This Week"
            movies={trending}
            onMovieClick={setSelectedMovie}
          />
          <MovieRow
            title="Popular"
            movies={popular}
            onMovieClick={setSelectedMovie}
          />
          <MovieRow
            title="Top Rated"
            movies={topRated}
            onMovieClick={setSelectedMovie}
          />
        </div>
      )}

      <MovieDetailModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </div>
  );
}
