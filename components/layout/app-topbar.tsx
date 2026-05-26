"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SearchPaletteTrigger } from "@/components/search/search-palette-trigger";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function AppTopBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex items-center gap-4 px-4 md:px-8 py-3.5 transition-[backdrop-filter,background-color,border-color] duration-300",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-xl backdrop-saturate-150"
          : "border-b border-transparent bg-gradient-to-b from-background via-background/60 to-transparent",
      )}
    >
      <SearchPaletteTrigger />

      <div className="ml-auto flex items-center gap-1">
        <NotificationBell />
      </div>
    </header>
  );
}
