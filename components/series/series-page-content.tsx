"use client";

import { useState, useMemo } from "react";
import { Search, X, Loader2, AlertCircle } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { cn } from "@/lib/utils";
import type { Movie } from "@/types/movie";
import { useTVSearchInfinite } from "@/hooks/use-tv";
import useInfiniteScroll from "react-infinite-scroll-hook";
import { MovieGrid } from "@/components/movies/movie-grid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SeriesContent } from "@/components/series/series-content";
import { SeriesGridContent } from "@/components/series/series-grid-content";

interface SeriesPageContentProps {
  trending: Movie[];
  korean: Movie[];
  chinese: Movie[];
  topRated: Movie[];
}

function dedupeShows(
  pages:
    | {
        page: number;
        results: Movie[];
        total_pages: number;
        total_results: number;
      }[]
    | undefined,
): Movie[] {
  if (!pages) return [];
  const seen = new Set<number>();
  const result: Movie[] = [];
  for (const page of pages) {
    for (const show of page.results) {
      if (!seen.has(show.id)) {
        seen.add(show.id);
        result.push(show);
      }
    }
  }
  return result;
}

export function SeriesPageContent({
  trending,
  korean,
  chinese,
  topRated,
}: SeriesPageContentProps) {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const debouncedSetQuery = useDebouncedCallback((value: string) => {
    setDebouncedQuery(value);
  }, 300);

  const isSearchActive = debouncedQuery.length >= 2;

  const searchQuery = useTVSearchInfinite(debouncedQuery);

  const searchShows = useMemo(
    () => dedupeShows(searchQuery.data?.pages),
    [searchQuery.data],
  );

  const [searchSentinelRef] = useInfiniteScroll({
    loading: searchQuery.isFetchingNextPage,
    hasNextPage: searchQuery.hasNextPage ?? false,
    onLoadMore: searchQuery.fetchNextPage,
    disabled: Boolean(searchQuery.error),
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

  return (
    <div>
      {/* Search bar — always visible */}
      <div className="mb-8 max-w-full sm:max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search TV shows..."
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

      {isSearchActive ? (
        /* Search results — curated rows and Browse All are hidden */
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
          ) : searchShows.length > 0 ? (
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
              <MovieGrid
                movies={searchShows}
                hrefPrefix="/tv/"
                mediaType="tv"
                sentinelRef={searchSentinelRef}
                isFetchingMore={searchQuery.isFetchingNextPage}
                readOnly
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No TV shows found</h3>
              <p className="text-sm text-muted-foreground">
                No TV shows found for &ldquo;{debouncedQuery}&rdquo;
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Curated rows + Browse All — shown when search is inactive */
        <>
          <SeriesContent
            trending={trending}
            korean={korean}
            chinese={chinese}
            topRated={topRated}
          />

          <div className="mt-12 mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Browse All</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Filter and sort all TV shows
            </p>
          </div>

          <SeriesGridContent />
        </>
      )}
    </div>
  );
}
