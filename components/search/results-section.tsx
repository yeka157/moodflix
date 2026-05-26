"use client";

import Image from "next/image";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import type { MultiSearchResult } from "@/types/movie";

interface ResultsSectionProps {
  results: MultiSearchResult[];
  onSelectResult: (item: MultiSearchResult) => void;
}

export function ResultsSection({
  results,
  onSelectResult,
}: ResultsSectionProps) {
  if (results.length === 0) return null;

  return (
    <CommandGroup heading="Results">
      {results.map((item) => (
        <CommandItem
          key={`${item.mediaType}-${item.id}`}
          value={`result-${item.mediaType}-${item.id}-${item.title}`}
          onSelect={() => onSelectResult(item)}
          className="gap-3"
        >
          <div className="relative size-8 h-12 shrink-0 overflow-hidden rounded bg-muted">
            {item.posterPath ? (
              <Image
                src={`https://image.tmdb.org/t/p/w92${item.posterPath}`}
                alt=""
                fill
                sizes="32px"
                className="object-cover"
              />
            ) : null}
          </div>
          <Badge
            variant={item.mediaType === "movie" ? "default" : "secondary"}
            className="text-[9px] px-1.5 py-0"
          >
            {item.mediaType === "movie" ? "FILM" : "TV"}
          </Badge>
          <span className="truncate flex-1">{item.title}</span>
          {item.year && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {item.year}
            </span>
          )}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
