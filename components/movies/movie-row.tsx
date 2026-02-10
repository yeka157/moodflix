"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Movie } from "@/types/movie";
import { MovieCard } from "./movie-card";
import { MovieCardSkeleton } from "./movie-card-skeleton";

interface MovieRowProps {
  title: string;
  movies: Movie[];
  isLoading?: boolean;
  onMovieClick?: (movie: Movie) => void;
}

export function MovieRow({ title, movies, isLoading = false, onMovieClick }: MovieRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

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
      <h2 className="text-xl font-semibold">{title}</h2>

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
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[150px] sm:w-[170px] md:w-[185px]">
                <MovieCardSkeleton />
              </div>
            ))
          ) : (
            movies.map((movie) => (
              <div
                key={movie.id}
                className="flex-shrink-0 w-[150px] sm:w-[170px] md:w-[185px]"
              >
                <MovieCard movie={movie} onClick={onMovieClick} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
