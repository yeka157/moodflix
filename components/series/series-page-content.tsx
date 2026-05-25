"use client";

import { useState, useMemo } from "react";
import { Search, X, Loader2, AlertCircle } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { cn } from "@/lib/utils";
import type { Movie } from "@/types/movie";
import { useTVSearchInfinite } from "@/hooks/use-tv";
import useInfiniteScroll from "react-infinite-scroll-hook";
import { MovieGrid } from "@/components/movies/movie-grid";
import { SeriesContent } from "@/components/series/series-content";
import { SeriesGridContent } from "@/components/series/series-grid-content";
import { SeriesFeatured } from "@/components/series/series-featured";

interface SeriesPageContentProps {
  trending: Movie[];
  onTheAir?: Movie[];
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

function pad(n: number, len = 3) {
  return String(n).padStart(len, "0");
}

export function SeriesPageContent({
  trending,
  onTheAir = [],
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

  const featured = trending.find((s) => s.backdrop_path) ?? null;
  const totalCount =
    trending.length + korean.length + chinese.length + topRated.length;

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="section-eyebrow">
          <span className="id">SERIES · {pad(totalCount)} TITLES</span>
        </div>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <h1 className="display text-[clamp(56px,7vw,104px)] m-0">
            The{" "}
            <span className="serif-it text-[var(--ink-2)] normal-case tracking-[-0.015em]">
              long
            </span>
            <br />
            form.
          </h1>
          <p className="text-[var(--ink-3)] max-w-[380px] text-sm m-0 leading-[1.55]">
            Series we keep returning to, season after season. Filtered, ranked,
            and ready when you are.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="search-pill max-w-[520px] mb-8">
        <Search className="size-4 text-[var(--ink-3)]" />
        <input
          type="text"
          placeholder="Search TV shows…"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            debouncedSetQuery(e.target.value);
          }}
        />
        {inputValue ? (
          <button
            type="button"
            onClick={() => {
              setInputValue("");
              setDebouncedQuery("");
            }}
            aria-label="Clear search"
            className="text-[var(--ink-3)] cursor-pointer grid place-items-center"
          >
            {searchQuery.isFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <X className="size-4" />
            )}
          </button>
        ) : (
          <span className="kbd">⌘K</span>
        )}
      </div>

      {isSearchActive ? (
        <div className="space-y-4">
          {searchQuery.isLoading ? (
            <MovieGrid movies={[]} isLoading />
          ) : searchQuery.isError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="size-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Search failed</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Something went wrong. Please try again.
              </p>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => searchQuery.refetch()}
              >
                Retry
              </button>
            </div>
          ) : searchShows.length > 0 ? (
            <div
              className={cn(
                "space-y-4 relative transition-opacity duration-200",
                searchQuery.isPlaceholderData && "opacity-50 pointer-events-none",
              )}
            >
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
              <Search className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No TV shows found</h3>
              <p className="text-sm text-muted-foreground">
                No matches for &ldquo;{debouncedQuery}&rdquo;
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          {featured && <SeriesFeatured show={featured} />}

          <SeriesContent
            trending={trending}
            onTheAir={onTheAir}
            korean={korean}
            chinese={chinese}
            topRated={topRated}
          />

          <div className="mt-20 mb-8">
            <div className="section-eyebrow">
              <span className="id">BROWSE ALL · FILTER &amp; SORT</span>
            </div>
            <h2 className="section-title text-[clamp(40px,5vw,72px)] m-0">
              The <span className="it">full</span> catalog
            </h2>
          </div>

          <SeriesGridContent />
        </>
      )}
    </>
  );
}
