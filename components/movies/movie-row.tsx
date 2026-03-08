"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { Movie } from "@/types/movie";
import type { MediaType } from "@/types/media";
import { formatReleaseDateBadge } from "@/lib/utils";
import { MovieCard } from "./movie-card";
import { MovieCardSkeleton } from "./movie-card-skeleton";

interface MovieRowProps {
  title: string;
  movies: Movie[];
  isLoading?: boolean;
  isUpdating?: boolean;
  onMovieClick?: (movie: Movie) => void;
  hrefPrefix?: string;
  mediaType?: MediaType;
  readOnly?: boolean;
  showReleaseBadge?: boolean;
}

export function MovieRow({
  title,
  movies,
  isLoading = false,
  isUpdating = false,
  onMovieClick,
  hrefPrefix,
  mediaType = "movie",
  readOnly = false,
  showReleaseBadge = false,
}: MovieRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Determine the href prefix: explicit prop takes priority, otherwise derive from mediaType
  const resolvedHrefPrefix = hrefPrefix ?? (onMovieClick ? undefined : `/${mediaType}/`);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    handleScroll();
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [movies]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        {isUpdating && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary animate-in fade-in zoom-in duration-300">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-[10px] font-medium">Updating...</span>
          </div>
        )}
      </div>

      <div className="group/row relative">
        {/* Left arrow */}
        {showLeftArrow && (
          <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center opacity-0 transition-opacity duration-200 group-hover/row:opacity-100 [@media(hover:none)]:opacity-100">
            <div className="flex items-center h-full bg-gradient-to-r from-background via-background/80 to-transparent pr-4 pl-1">
              <button
                className="flex items-center justify-center h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 hover:scale-110 text-white transition-all duration-200"
                onClick={() => scroll("left")}
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Right arrow */}
        {showRightArrow && (
          <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center opacity-0 transition-opacity duration-200 group-hover/row:opacity-100 [@media(hover:none)]:opacity-100">
            <div className="flex items-center h-full bg-gradient-to-l from-background via-background/80 to-transparent pl-4 pr-1">
              <button
                className="flex items-center justify-center h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 hover:scale-110 text-white transition-all duration-200"
                onClick={() => scroll("right")}
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Scroll container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
        >
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[150px] sm:w-[170px] md:w-[185px]"
                >
                  <MovieCardSkeleton />
                </div>
              ))
            : movies.map((movie) => (
                <div
                  key={movie.id}
                  className="flex-shrink-0 w-[150px] sm:w-[170px] md:w-[185px]"
                >
                  <MovieCard
                    movie={movie}
                    href={resolvedHrefPrefix ? `/${movie.media_type ?? mediaType}/${movie.id}` : undefined}
                    onClick={resolvedHrefPrefix ? undefined : onMovieClick}
                    readOnly={readOnly}
                    mediaType={mediaType}
                    releaseDateBadge={showReleaseBadge ? formatReleaseDateBadge(movie.release_date) : undefined}
                    hideWatchedButton={showReleaseBadge}
                  />
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
