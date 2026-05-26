"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchPalette } from "./search-palette";

export function SearchPaletteTrigger() {
  const [open, setOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- platform detection requires window/navigator (client-only)
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(navigator.platform));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleClick = useCallback(() => setOpen(true), []);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Open search"
        className={cn(
          "group flex flex-1 items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2.5 max-w-[520px]",
          "transition-colors hover:border-[var(--line-strong)] hover:bg-secondary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        )}
      >
        <Search className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="flex-1 text-left text-[13.5px] text-muted-foreground">
          Search films, series…
        </span>
        <span className="font-mono rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {isMac ? "⌘K" : "Ctrl+K"}
        </span>
      </button>
      <SearchPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
