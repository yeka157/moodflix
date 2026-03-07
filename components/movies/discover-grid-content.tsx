"use client";

import { useState, useMemo } from "react";
import { Search, X, Loader2, AlertCircle, SlidersHorizontal } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { cn } from "@/lib/utils";
import type { Movie, MovieListResponse } from "@/types/movie";
import {
  useMovieSearchInfinite,
  useDiscoverMovies,
  useUpcomingMovies,
} from "@/hooks/use-movies";
import useInfiniteScroll from "react-infinite-scroll-hook";
import { GENRES } from "@/lib/constants";
import { MovieGrid } from "./movie-grid";
import { MovieRow } from "./movie-row";
import { MovieSearchDrawer } from "./movie-search-drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GENRE_OPTIONS = [
  { value: "all", label: "All Genres" },
  ...Object.entries(GENRES).map(([id, name]) => ({ value: id, label: name })),
];

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "primary_release_date.desc", label: "Newest" },
  { value: "title.asc", label: "A-Z" },
];

const YEAR_OPTIONS = [
  { value: "all", label: "All Years" },
  { value: "2026", label: "2026" },
  { value: "2025", label: "2025" },
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
  { value: "2022", label: "2022" },
  { value: "2021", label: "2021" },
  { value: "2020", label: "2020" },
  { value: "2020s", label: "2020s" },
  { value: "2010s", label: "2010s" },
  { value: "2000s", label: "2000s" },
  { value: "1990s", label: "1990s" },
  { value: "1980s", label: "1980s" },
];

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

export function DiscoverGridContent() {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [genreId, setGenreId] = useState("all");
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [year, setYear] = useState("all");
  const [selectedSearchResult, setSelectedSearchResult] = useState<Movie | null>(null);

  const debouncedSetQuery = useDebouncedCallback((value: string) => {
    setDebouncedQuery(value);
  }, 300);

  const isSearchActive = debouncedQuery.length >= 2;

  const discoverParams = useMemo(
    () => ({
      genreId: genreId === "all" ? "" : genreId,
      sortBy,
      year: year === "all" ? "" : year,
    }),
    [genreId, sortBy, year],
  );

  const searchQuery = useMovieSearchInfinite(debouncedQuery);
  const discoverQuery = useDiscoverMovies(discoverParams);
  const upcomingQuery = useUpcomingMovies();

  const searchMovies = useMemo(
    () => dedupeMovies(searchQuery.data?.pages),
    [searchQuery.data],
  );
  const searchTotal = searchQuery.data?.pages[0]?.total_results ?? 0;

  const discoverMovies = useMemo(
    () => dedupeMovies(discoverQuery.data?.pages),
    [discoverQuery.data],
  );

  const [searchSentinelRef] = useInfiniteScroll({
    loading: searchQuery.isFetchingNextPage,
    hasNextPage: searchQuery.hasNextPage ?? false,
    onLoadMore: searchQuery.fetchNextPage,
    disabled: Boolean(searchQuery.error),
    rootMargin: "0px 0px 400px 0px",
  });

  const [discoverSentinelRef] = useInfiniteScroll({
    loading: discoverQuery.isFetchingNextPage,
    hasNextPage: discoverQuery.hasNextPage ?? false,
    onLoadMore: discoverQuery.fetchNextPage,
    disabled: Boolean(discoverQuery.error),
    rootMargin: "0px 0px 400px 0px",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSetQuery(value);
  };

  const handleClear = () => {
    setInputValue("");
    setDebouncedQuery("");
  };

  const hasActiveFilters = genreId !== "all" || sortBy !== "popularity.desc" || year !== "all";

  const handleResetFilters = () => {
    setGenreId("all");
    setSortBy("popularity.desc");
    setYear("all");
  };

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="max-w-full sm:max-w-xl">
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
              aria-label="Clear search"
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

      {/* Filter bar — hidden when search is active */}
      {!isSearchActive && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1 flex-wrap sm:flex-nowrap">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />

            <Select value={genreId} onValueChange={setGenreId}>
              <SelectTrigger className="h-10 flex-1 sm:max-w-[180px]">
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent>
                {GENRE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-10 flex-1 sm:max-w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-10 flex-1 sm:max-w-[160px]">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 text-xs self-start sm:self-auto shrink-0"
              onClick={handleResetFilters}
            >
              Reset
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      {isSearchActive ? (
        <div className="space-y-4">
          {searchQuery.isLoading ? (
            <MovieGrid movies={[]} isLoading />
          ) : searchQuery.isError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Search failed</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Something went wrong while searching. Please try again.
              </p>
              <Button variant="outline" onClick={() => searchQuery.refetch()}>
                Retry
              </Button>
            </div>
          ) : searchMovies.length > 0 ? (
            <div
              className={cn(
                "space-y-4 relative transition-opacity duration-200",
                searchQuery.isPlaceholderData && "opacity-50 pointer-events-none",
              )}
            >
              {searchQuery.isPlaceholderData && (
                <div className="absolute inset-0 z-10 flex items-start justify-center pt-20">
                  <div className="bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full border shadow-lg flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm font-medium">Updating results...</span>
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Found {searchTotal.toLocaleString()} results
              </p>
              {/* Search results: onClick opens drawer (no href) */}
              <MovieGrid
                movies={searchMovies}
                onMovieClick={setSelectedSearchResult}
                sentinelRef={searchSentinelRef}
                isFetchingMore={searchQuery.isFetchingNextPage}
              />
            </div>
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
      ) : (
        <div className="space-y-6">
          {/* Coming Soon row — shown when no filters are active */}
          {!hasActiveFilters && upcomingQuery.data && upcomingQuery.data.results.length > 0 && (
            <MovieRow
              title="Coming Soon"
              movies={upcomingQuery.data.results}
              mediaType="movie"
              showReleaseBadge
            />
          )}

          {discoverQuery.isLoading ? (
            <MovieGrid movies={[]} isLoading />
          ) : discoverQuery.isError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to load movies</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Something went wrong. Please try again.
              </p>
              <Button variant="outline" onClick={() => discoverQuery.refetch()}>
                Retry
              </Button>
            </div>
          ) : discoverMovies.length > 0 ? (
            <div
              className={cn(
                "space-y-4 relative transition-opacity duration-200",
                discoverQuery.isPlaceholderData && "opacity-50 pointer-events-none",
              )}
            >
              {discoverQuery.isPlaceholderData && (
                <div className="absolute inset-0 z-10 flex items-start justify-center pt-20">
                  <div className="bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full border shadow-lg flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm font-medium">Updating results...</span>
                  </div>
                </div>
              )}
              {/* Discover grid results: link-based navigation */}
              <MovieGrid
                movies={discoverMovies}
                hrefPrefix="/movie/"
                sentinelRef={discoverSentinelRef}
                isFetchingMore={discoverQuery.isFetchingNextPage}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No movies found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters to find something you&apos;ll enjoy
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleResetFilters}
                >
                  Reset filters
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search drawer for quick preview of search results */}
      <MovieSearchDrawer
        movie={selectedSearchResult}
        open={!!selectedSearchResult}
        onOpenChange={(open: boolean) => {
          if (!open) setSelectedSearchResult(null);
        }}
      />
    </div>
  );
}
