"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { Movie } from "@/types/movie";
import type { MediaType } from "@/types/media";
import { formatReleaseDateBadge } from "@/lib/utils";
import { MovieCard } from "./movie-card";
import { MovieCardSkeleton } from "./movie-card-skeleton";
import { SectionHeader } from "@/components/layout/section-header";

interface MovieRowProps {
  title: ReactNode;
  eyebrowId?: string;
  eyebrowLabel?: string;
  movies: Movie[];
  isLoading?: boolean;
  isUpdating?: boolean;
  onMovieClick?: (movie: Movie) => void;
  hrefPrefix?: string;
  mediaType?: MediaType;
  readOnly?: boolean;
  showReleaseBadge?: boolean;
  showRank?: boolean;
}

export function MovieRow({
  title,
  eyebrowId,
  eyebrowLabel,
  movies,
  isLoading = false,
  isUpdating = false,
  onMovieClick,
  hrefPrefix,
  mediaType = "movie",
  readOnly = false,
  showReleaseBadge = false,
  showRank = false,
}: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const resolvedHrefPrefix =
    hrefPrefix ?? (onMovieClick ? undefined : `/${mediaType}/`);

  const updateArrows = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanPrev(scrollLeft > 4);
    setCanNext(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  const scroll = (dir: "left" | "right") => {
    const el = rowRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows);
    return () => el.removeEventListener("scroll", updateArrows);
  }, [updateArrows, movies]);

  return (
    <section className="reveal">
      <SectionHeader
        eyebrowId={eyebrowId}
        eyebrowLabel={eyebrowLabel}
        title={title}
        isUpdating={isUpdating}
        onPrev={() => scroll("left")}
        onNext={() => scroll("right")}
        canPrev={canPrev}
        canNext={canNext}
      />

      <div ref={rowRef} className="row">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card">
                <MovieCardSkeleton />
              </div>
            ))
          : movies.map((movie, i) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                href={
                  resolvedHrefPrefix
                    ? `/${movie.media_type ?? mediaType}/${movie.id}`
                    : undefined
                }
                onClick={resolvedHrefPrefix ? undefined : onMovieClick}
                readOnly={readOnly}
                mediaType={mediaType}
                releaseDateBadge={
                  showReleaseBadge
                    ? formatReleaseDateBadge(movie.release_date)
                    : undefined
                }
                hideWatchedButton={showReleaseBadge}
                rank={showRank ? i + 1 : undefined}
              />
            ))}
      </div>
    </section>
  );
}
