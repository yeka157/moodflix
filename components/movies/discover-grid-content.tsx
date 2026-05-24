"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  X,
  Loader2,
  AlertCircle,
  Grid3x3,
  List,
  ChevronDown,
  Play,
  Plus,
} from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { cn, getBackdropUrl, getPosterUrl } from "@/lib/utils";
import type { Movie, MovieListResponse } from "@/types/movie";
import {
  useMovieSearchInfinite,
  useDiscoverMovies,
} from "@/hooks/use-movies";
import useInfiniteScroll from "react-infinite-scroll-hook";
import { GENRES } from "@/lib/constants";
import { MovieGrid } from "./movie-grid";
import { MovieSearchDrawer } from "./movie-search-drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Top 9 popular genres for chip row (rest available via "More" dropdown)
const CHIP_GENRES: { id: string; name: string }[] = [
  { id: "all", name: "All" },
  { id: "28", name: "Action" },
  { id: "12", name: "Adventure" },
  { id: "16", name: "Animation" },
  { id: "35", name: "Comedy" },
  { id: "18", name: "Drama" },
  { id: "27", name: "Horror" },
  { id: "53", name: "Thriller" },
  { id: "10749", name: "Romance" },
];

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Popular" },
  { value: "vote_average.desc", label: "Top rated" },
  { value: "primary_release_date.desc", label: "Newest" },
  { value: "title.asc", label: "A-Z" },
];

const YEAR_OPTIONS = [
  { value: "all", label: "Any" },
  { value: "2026", label: "2026" },
  { value: "2025", label: "2025" },
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
  { value: "2022", label: "2022" },
  { value: "2020s", label: "2020s" },
  { value: "2010s", label: "2010s" },
  { value: "2000s", label: "2000s" },
  { value: "1990s", label: "1990s" },
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

function pad(n: number, len = 3) {
  return String(n).padStart(len, "0");
}

export function DiscoverGridContent() {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [genreId, setGenreId] = useState("all");
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [year, setYear] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedSearchResult, setSelectedSearchResult] = useState<Movie | null>(null);
  const [hoveredMovie, setHoveredMovie] = useState<Movie | null>(null);

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

  const activeMovies = isSearchActive ? searchMovies : discoverMovies;
  const activeQuery = isSearchActive ? searchQuery : discoverQuery;
  const totalLabel = isSearchActive
    ? searchTotal
    : (discoverQuery.data?.pages[0]?.total_results ?? activeMovies.length);

  const previewMovie =
    hoveredMovie ?? activeMovies[0] ?? null;

  const sortLabel =
    SORT_OPTIONS.find((s) => s.value === sortBy)?.label ?? "Sort";
  const yearLabel =
    YEAR_OPTIONS.find((y) => y.value === year)?.label ?? "Year";

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="section-eyebrow">
          <span className="bar" />
          <span className="id">
            CATALOG · {pad(totalLabel || 0)} TITLES
          </span>
        </div>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <h1
            className="display"
            style={{ fontSize: "clamp(56px, 7vw, 104px)", margin: 0 }}
          >
            Discover{" "}
            <span
              className="serif-it"
              style={{
                color: "var(--ink-2)",
                textTransform: "none",
                letterSpacing: "-0.015em",
              }}
            >
              everything.
            </span>
          </h1>
          <p
            style={{
              color: "var(--ink-3)",
              maxWidth: 360,
              fontSize: 14,
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            Films across the moodflix catalog. Filter, sort, and follow your
            curiosity.
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div
        className="search-pill"
        style={{ maxWidth: 520, marginBottom: 24 }}
      >
        <Search className="size-4" style={{ color: "var(--ink-3)" }} />
        <input
          type="text"
          placeholder="Search films by title…"
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
            style={{
              color: "var(--ink-3)",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}
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

      {/* Filter bar */}
      {!isSearchActive && (
        <div className="flex gap-2 mb-8 flex-wrap items-center">
          {CHIP_GENRES.map((g) => (
            <button
              key={g.id}
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-[9px] rounded-full border border-border bg-card text-[12.5px] text-[var(--ink-2)] transition-[border-color,background-color,color] duration-200 hover:text-foreground hover:border-[var(--ink-4)] cursor-pointer font-[inherit]",
                genreId === g.id && "bg-foreground text-background border-foreground",
              )}
              onClick={() => setGenreId(g.id)}
            >
              {g.name}
              {genreId === g.id && discoverMovies.length > 0 && (
                <span className="font-mono text-[10px] opacity-70">·{discoverMovies.length}</span>
              )}
            </button>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-[9px] rounded-full border border-border bg-card text-[12.5px] text-[var(--ink-2)] transition-[border-color,background-color,color] duration-200 hover:text-foreground hover:border-[var(--ink-4)] cursor-pointer font-[inherit]"
              >
                More genres
                <ChevronDown className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {Object.entries(GENRES).map(([id, name]) => (
                <DropdownMenuItem
                  key={id}
                  onSelect={() => setGenreId(id)}
                  className={cn(genreId === id && "text-primary")}
                >
                  {name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-[22px] bg-border mx-2" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-[9px] rounded-full border border-border bg-card text-[12.5px] text-[var(--ink-2)] transition-[border-color,background-color,color] duration-200 hover:text-foreground hover:border-[var(--ink-4)] cursor-pointer font-[inherit]"
              >
                Year: {yearLabel}
                <ChevronDown className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {YEAR_OPTIONS.map((y) => (
                <DropdownMenuItem
                  key={y.value}
                  onSelect={() => setYear(y.value)}
                  className={cn(year === y.value && "text-primary")}
                >
                  {y.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-[9px] rounded-full border border-border bg-card text-[12.5px] text-[var(--ink-2)] transition-[border-color,background-color,color] duration-200 hover:text-foreground hover:border-[var(--ink-4)] cursor-pointer font-[inherit]"
              >
                Sort: {sortLabel}
                <ChevronDown className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {SORT_OPTIONS.map((s) => (
                <DropdownMenuItem
                  key={s.value}
                  onSelect={() => setSortBy(s.value)}
                  className={cn(sortBy === s.value && "text-primary")}
                >
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto flex gap-1">
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-[9px] rounded-full border border-border bg-card text-[12.5px] text-[var(--ink-2)] transition-[border-color,background-color,color] duration-200 hover:text-foreground hover:border-[var(--ink-4)] cursor-pointer font-[inherit]",
                view === "grid" && "bg-foreground text-background border-foreground",
              )}
              onClick={() => setView("grid")}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
            >
              <Grid3x3 className="size-3" />
            </button>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-[9px] rounded-full border border-border bg-card text-[12.5px] text-[var(--ink-2)] transition-[border-color,background-color,color] duration-200 hover:text-foreground hover:border-[var(--ink-4)] cursor-pointer font-[inherit]",
                view === "list" && "bg-foreground text-background border-foreground",
              )}
              onClick={() => setView("list")}
              aria-label="List view"
              aria-pressed={view === "list"}
            >
              <List className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* Split layout */}
      <div className="grid gap-10 [grid-template-columns:minmax(0,1fr)] lg:[grid-template-columns:minmax(0,1fr)_380px]">
        <div>
          {activeQuery.isLoading ? (
            <MovieGrid movies={[]} isLoading />
          ) : activeQuery.isError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="size-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isSearchActive ? "Search failed" : "Failed to load movies"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Something went wrong. Please try again.
              </p>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => activeQuery.refetch()}
              >
                Retry
              </button>
            </div>
          ) : activeMovies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No movies found</h3>
              <p className="text-sm text-muted-foreground">
                {isSearchActive
                  ? "Try searching for a different title"
                  : "Try adjusting your filters"}
              </p>
            </div>
          ) : isSearchActive ? (
            <div
              className={cn(
                "space-y-4 relative transition-opacity duration-200",
                searchQuery.isPlaceholderData && "opacity-50 pointer-events-none",
              )}
            >
              <p className="text-sm text-muted-foreground">
                Found {searchTotal.toLocaleString()} results
              </p>
              <MovieGrid
                movies={searchMovies}
                onMovieClick={setSelectedSearchResult}
                onMovieHover={setHoveredMovie}
                sentinelRef={searchSentinelRef}
                isFetchingMore={searchQuery.isFetchingNextPage}
              />
            </div>
          ) : view === "grid" ? (
            <div
              className={cn(
                "transition-opacity duration-200",
                discoverQuery.isPlaceholderData && "opacity-50",
              )}
            >
              <MovieGrid
                movies={discoverMovies}
                hrefPrefix="/movie/"
                onMovieHover={setHoveredMovie}
                sentinelRef={discoverSentinelRef}
                isFetchingMore={discoverQuery.isFetchingNextPage}
              />
            </div>
          ) : (
            <DiscoverListView
              movies={discoverMovies}
              onHover={setHoveredMovie}
              sentinelRef={discoverSentinelRef}
              isFetchingMore={discoverQuery.isFetchingNextPage}
            />
          )}
        </div>

        {/* Sticky preview panel — lg+ only */}
        <aside
          className="hidden lg:block"
          style={{
            position: "sticky",
            top: 96,
            alignSelf: "start",
            height: "fit-content",
          }}
        >
          {previewMovie && <PreviewCard movie={previewMovie} />}
        </aside>
      </div>

      <MovieSearchDrawer
        movie={selectedSearchResult}
        open={!!selectedSearchResult}
        onOpenChange={(open: boolean) => {
          if (!open) setSelectedSearchResult(null);
        }}
      />
    </>
  );
}

function DiscoverListView({
  movies,
  onHover,
  sentinelRef,
  isFetchingMore,
}: {
  movies: Movie[];
  onHover: (m: Movie) => void;
  sentinelRef: (node: HTMLDivElement | null) => void;
  isFetchingMore?: boolean;
}) {
  return (
    <div className="border-t border-border">
      {movies.map((m, i) => {
        const genre = m.genre_ids?.slice(0, 2).map((id) => GENRES[id]).filter(Boolean).join(", ");
        return (
          <Link
            key={m.id}
            href={`/movie/${m.id}`}
            className="grid grid-cols-[32px_48px_1fr_64px] gap-3 md:grid-cols-[40px_64px_1fr_100px_80px] md:gap-5 items-center px-2 py-3.5 border-b border-border text-left cursor-pointer transition-colors bg-transparent w-full no-underline text-inherit font-[inherit] hover:bg-card"
            onMouseEnter={() => onHover(m)}
            onFocus={() => onHover(m)}
          >
            <div className="font-mono text-muted-foreground text-xs">{pad(i + 1)}</div>
            {m.poster_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getPosterUrl(m.poster_path)}
                alt=""
                className="w-11 h-16 object-cover rounded bg-muted"
                loading="lazy"
              />
            ) : (
              <div className="w-11 h-16 object-cover rounded bg-muted" />
            )}
            <div className="min-w-0">
              <p className="text-[15px] font-medium m-0 mb-1 text-foreground whitespace-nowrap overflow-hidden text-ellipsis">{m.title}</p>
              <p className="text-xs text-muted-foreground font-mono whitespace-nowrap overflow-hidden text-ellipsis">
                {genre || "—"}
                {m.original_language && ` · ${m.original_language.toUpperCase()}`}
              </p>
            </div>
            <div className="font-mono text-[13px] text-[var(--ink-2)] max-md:hidden">
              {m.release_date ? m.release_date.slice(0, 4) : "—"}
            </div>
            <div className="font-mono text-[13px] text-foreground text-right">
              ★ {m.vote_average?.toFixed(1) ?? "—"}
            </div>
          </Link>
        );
      })}
      <div ref={sentinelRef} className="flex justify-center py-8">
        {isFetchingMore && (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
}

function PreviewCard({ movie }: { movie: Movie }) {
  const year = movie.release_date?.slice(0, 4) ?? "—";
  const genres = (movie.genre_ids ?? [])
    .slice(0, 3)
    .map((id) => GENRES[id])
    .filter(Boolean);
  const rating = movie.vote_average?.toFixed(1) ?? "—";

  return (
    <div className="bg-card border border-border rounded-[20px] overflow-hidden" key={movie.id}>
      <div className="relative aspect-[16/10] overflow-hidden after:content-[''] after:absolute after:inset-0 after:bg-[linear-gradient(to_top,var(--bg-elev)_0%,transparent_50%)]">
        {movie.backdrop_path ? (
          <Image
            src={getBackdropUrl(movie.backdrop_path, "lg")}
            alt=""
            fill
            sizes="380px"
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "var(--bg-elev-2)" }} />
        )}
      </div>
      <div className="px-5 pb-5 -mt-14 relative">
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          {year}
        </div>
        <h3
          style={{
            fontFamily: "var(--font-display), Inter, sans-serif",
            fontSize: 34,
            lineHeight: 0.9,
            margin: "0 0 14px",
            textTransform: "uppercase",
            letterSpacing: "0.005em",
          }}
        >
          {movie.title}
        </h3>
        {genres.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            {genres.map((g) => (
              <span
                key={g}
                style={{
                  fontSize: 10.5,
                  padding: "3px 9px",
                  border: "1px solid var(--line-strong)",
                  borderRadius: 999,
                  fontFamily: "var(--font-mono), monospace",
                  letterSpacing: "0.1em",
                  color: "var(--ink-2)",
                  textTransform: "uppercase",
                }}
              >
                {g}
              </span>
            ))}
          </div>
        )}
        {movie.overview && (
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-2)",
              lineHeight: 1.55,
              margin: "0 0 18px",
            }}
            className="line-clamp-4"
          >
            {movie.overview}
          </p>
        )}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 18,
            paddingBottom: 18,
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div>
            <div className="eyebrow">Rating</div>
            <div className="mono" style={{ fontSize: 18, marginTop: 4 }}>
              ★ {rating}
            </div>
          </div>
          <div>
            <div className="eyebrow">Year</div>
            <div className="mono" style={{ fontSize: 18, marginTop: 4 }}>
              {year}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href={`/movie/${movie.id}`}
            className="btn btn-red"
            style={{ flex: 1, justifyContent: "center" }}
          >
            <Play size={14} fill="currentColor" />
            Open
          </Link>
          <button type="button" className="btn btn-ghost">
            <Plus size={14} />
            Library
          </button>
        </div>
      </div>
    </div>
  );
}
