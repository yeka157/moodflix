"use client";

import Image from "next/image";
import { useTrendingMovies } from "@/hooks/use-movies";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

interface TrendingSectionProps {
  onSelectMovie: (id: number) => void;
}

export function TrendingSection({ onSelectMovie }: TrendingSectionProps) {
  const { data, isLoading } = useTrendingMovies(1);

  if (isLoading) {
    return (
      <CommandGroup heading="Trending this week">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-2 py-1.5"
            aria-hidden="true"
          >
            <div className="size-12 bg-muted/40 rounded animate-pulse" />
            <div className="flex-1 h-4 bg-muted/40 rounded animate-pulse" />
          </div>
        ))}
      </CommandGroup>
    );
  }

  const items = (data?.results ?? []).slice(0, 7);
  if (items.length === 0) return null;

  return (
    <CommandGroup heading="Trending this week">
      {items.map((movie) => {
        const year =
          movie.release_date && movie.release_date.length >= 4
            ? movie.release_date.slice(0, 4)
            : null;
        return (
          <CommandItem
            key={movie.id}
            value={`trending-${movie.id}-${movie.title}`}
            onSelect={() => onSelectMovie(movie.id)}
            className="gap-3"
          >
            <div className="relative size-8 h-12 shrink-0 overflow-hidden rounded bg-muted">
              {movie.poster_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                  alt=""
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <Badge variant="default" className="text-[9px] px-1.5 py-0">
              FILM
            </Badge>
            <span className="truncate flex-1">{movie.title}</span>
            {year && (
              <span className="text-xs tabular-nums text-muted-foreground">
                {year}
              </span>
            )}
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}
