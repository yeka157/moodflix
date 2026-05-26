"use client";

import { History, X } from "lucide-react";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import type { RecentEntry } from "./search-recent";

interface RecentSectionProps {
  entries: RecentEntry[];
  onSelectQuery: (q: string) => void;
  onClear: () => void;
}

export function RecentSection({
  entries,
  onSelectQuery,
  onClear,
}: RecentSectionProps) {
  if (entries.length === 0) return null;

  return (
    <CommandGroup
      heading={
        <div className="flex items-center justify-between pr-2">
          <span>Recent</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-3" aria-hidden="true" />
            Clear
          </button>
        </div>
      }
    >
      {entries.map((entry) => (
        <CommandItem
          key={entry.q}
          value={`recent:${entry.q}`}
          onSelect={() => onSelectQuery(entry.q)}
          className="gap-3"
        >
          <History className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="truncate">{entry.q}</span>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
