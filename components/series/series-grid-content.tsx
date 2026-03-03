"use client";

import { useState, useMemo } from "react";
import { Loader2, AlertCircle, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Movie } from "@/types/movie";
import { useDiscoverTV } from "@/hooks/use-tv";
import type { DiscoverTVParams } from "@/hooks/use-tv";
import useInfiniteScroll from "react-infinite-scroll-hook";
import { GENRES, TV_GENRES } from "@/lib/constants";
import { MovieGrid } from "@/components/movies/movie-grid";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Combine TV-specific genres with shared movie/TV genre IDs that appear on TV shows
const ALL_TV_GENRE_OPTIONS = [
  { value: "all", label: "All Genres" },
  // TV-specific genres first
  ...Object.entries(TV_GENRES).map(([id, name]) => ({ value: id, label: name })),
  // Shared genres also available on TV shows
  ...Object.entries(GENRES)
    .filter(([id]) => {
      const sharedIds = ["28", "12", "16", "35", "80", "99", "18", "14", "9648", "10749", "878", "53", "10752", "37"];
      return sharedIds.includes(id);
    })
    .map(([id, name]) => ({ value: id, label: name })),
];

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "first_air_date.desc", label: "Newest" },
  { value: "name.asc", label: "A-Z" },
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

export function SeriesGridContent() {
  const [genreId, setGenreId] = useState("all");
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [year, setYear] = useState("all");

  const discoverParams = useMemo<DiscoverTVParams>(
    () => ({
      genreId: genreId === "all" ? "" : genreId,
      sortBy,
      year: year === "all" ? "" : year,
    }),
    [genreId, sortBy, year],
  );

  const discoverQuery = useDiscoverTV(discoverParams);

  const shows = useMemo(
    () => dedupeShows(discoverQuery.data?.pages),
    [discoverQuery.data],
  );

  const paddedShows = useMemo(() => {
    if (discoverQuery.hasNextPage || discoverQuery.isFetchingNextPage) return shows;
    const remainder = shows.length % 6;
    if (remainder === 0 || shows.length === 0) return shows;
    const padCount = 6 - remainder;
    return [...shows, ...Array<null>(padCount).fill(null)];
  }, [shows, discoverQuery.hasNextPage, discoverQuery.isFetchingNextPage]);

  const [sentinelRef] = useInfiniteScroll({
    loading: discoverQuery.isFetchingNextPage,
    hasNextPage: discoverQuery.hasNextPage ?? false,
    onLoadMore: discoverQuery.fetchNextPage,
    disabled: Boolean(discoverQuery.error),
    rootMargin: "0px 0px 400px 0px",
  });

  const hasActiveFilters =
    genreId !== "all" || sortBy !== "popularity.desc" || year !== "all";

  const handleResetFilters = () => {
    setGenreId("all");
    setSortBy("popularity.desc");
    setYear("all");
  };

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 flex-wrap sm:flex-nowrap">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />

          <Select value={genreId} onValueChange={setGenreId}>
            <SelectTrigger className="h-10 flex-1 sm:max-w-[200px]">
              <SelectValue placeholder="All Genres" />
            </SelectTrigger>
            <SelectContent>
              {ALL_TV_GENRE_OPTIONS.map((opt) => (
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

      {/* Grid content */}
      {discoverQuery.isLoading ? (
        <MovieGrid movies={[]} isLoading />
      ) : discoverQuery.isError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load series</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Something went wrong. Please try again.
          </p>
          <Button variant="outline" onClick={() => discoverQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : shows.length > 0 ? (
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
          {/* TV show cards link to /tv/[id] */}
          <MovieGrid
            movies={paddedShows}
            hrefPrefix="/tv/"
            mediaType="tv"
            sentinelRef={sentinelRef}
            isFetchingMore={discoverQuery.isFetchingNextPage}
            readOnly
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No series found</h3>
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
  );
}
