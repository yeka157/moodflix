"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppTopBar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        router.push("/discover");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);

  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/i.test(navigator.platform);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex items-center gap-4 px-4 md:px-8 py-3.5 transition-[backdrop-filter,background-color,border-color] duration-300",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-xl backdrop-saturate-150"
          : "border-b border-transparent bg-gradient-to-b from-background via-background/60 to-transparent",
      )}
      style={{ backgroundImage: scrolled ? undefined : undefined }}
    >
      <Link
        href="/discover"
        className={cn(
          "group flex flex-1 items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2.5 max-w-[520px]",
          "transition-colors hover:border-[var(--line-strong)] hover:bg-secondary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        )}
        aria-label="Open search"
      >
        <Search className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="flex-1 text-[13.5px] text-muted-foreground">
          Search films, series, people…
        </span>
        <span className="font-mono rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {isMac ? "⌘K" : "Ctrl+K"}
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid h-9 w-9 place-items-center rounded-[10px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Bell className="size-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
