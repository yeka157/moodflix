"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useSearchMulti } from "@/hooks/use-search-multi";
import { useAddToWatchlist } from "@/hooks/use-watchlist";
import {
  getRecent,
  addRecent,
  clearRecent,
  type RecentEntry,
} from "./search-recent";
import { RecentSection } from "./recent-section";
import { TrendingSection } from "./trending-section";
import { ResultsSection } from "./results-section";
import type { MultiSearchResult } from "@/types/movie";

interface SearchPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchPalette({ open, onOpenChange }: SearchPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const { mutate: addToLibrary } = useAddToWatchlist();
  const { results, isLoading, debouncedQuery, isEnabled } =
    useSearchMulti(query);

  // Load recent on open; reset query on close
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- loading localStorage state on dialog open is intentional
      setRecent(getRecent());
    } else {
      setQuery("");
    }
  }, [open]);

  const closeAndPersist = useCallback(
    (persistQuery: string | null) => {
      if (persistQuery && persistQuery.trim()) {
        addRecent(persistQuery);
      }
      onOpenChange(false);
    },
    [onOpenChange],
  );

  const handleSelectResult = useCallback(
    (item: MultiSearchResult) => {
      const href =
        item.mediaType === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;
      router.push(href);
      closeAndPersist(debouncedQuery || query);
    },
    [router, closeAndPersist, debouncedQuery, query],
  );

  const handleSelectTrending = useCallback(
    (id: number) => {
      router.push(`/movie/${id}`);
      onOpenChange(false);
    },
    [router, onOpenChange],
  );

  const handleSelectRecent = useCallback((q: string) => {
    setQuery(q);
  }, []);

  const handleClearRecent = useCallback(() => {
    clearRecent();
    setRecent([]);
  }, []);

  // Cmd/Ctrl+Enter: inline add top result to library
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        const top = results[0];
        if (!top) return;
        addToLibrary(
          {
            tmdbId: top.id,
            mediaType: top.mediaType,
            title: top.title,
            posterPath: top.posterPath,
            status: "want_to_watch",
          },
          {
            onSuccess: () => toast.success(`Added "${top.title}" to library`),
            onError: (err) =>
              toast.error(
                err instanceof Error ? err.message : "Couldn't add to library",
              ),
          },
        );
      }
    },
    [results, addToLibrary],
  );

  const showResults = isEnabled && results.length > 0;
  const showEmpty =
    isEnabled &&
    !isLoading &&
    results.length === 0 &&
    debouncedQuery.length >= 2;
  const showInitial = !isEnabled;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-[640px] gap-0"
        showCloseButton={false}
      >
        <VisuallyHidden asChild>
          <DialogTitle>Search films and series</DialogTitle>
        </VisuallyHidden>
        <Command shouldFilter={false} loop>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            onKeyDown={handleInputKeyDown}
            placeholder="Search films, series…"
            autoFocus
          />
          <CommandList className="max-h-[60vh]">
            {showEmpty && (
              <CommandEmpty>
                No matches for &ldquo;{debouncedQuery}&rdquo;.
              </CommandEmpty>
            )}
            {showResults && (
              <ResultsSection
                results={results}
                onSelectResult={handleSelectResult}
              />
            )}
            {showInitial && (
              <>
                <RecentSection
                  entries={recent}
                  onSelectQuery={handleSelectRecent}
                  onClear={handleClearRecent}
                />
                <TrendingSection onSelectMovie={handleSelectTrending} />
              </>
            )}
          </CommandList>
          <div className="hidden md:flex items-center justify-end gap-3 border-t border-border px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>⌘↵ add</span>
            <span>esc close</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
