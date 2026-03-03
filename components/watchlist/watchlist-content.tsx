"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { WatchlistFilterStatus, WatchlistMediaFilter } from "@/types/watchlist";
import { useWatchlist } from "@/hooks/use-watchlist";
import { WatchlistCard } from "./watchlist-card";
import { WatchlistSkeleton } from "./watchlist-skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const TABS: { value: WatchlistFilterStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "want_to_watch", label: "Want to Watch" },
  { value: "watched", label: "Watched" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function WatchlistContent() {
  const [activeTab, setActiveTab] = useState<WatchlistFilterStatus>("all");
  const [mediaFilter, setMediaFilter] = useState<WatchlistMediaFilter>("all");

  // Always fetch ALL items — no status filter on the query
  const { data: allItems, isLoading } = useWatchlist();

  // Derive counts for filter labels
  const totalCount = allItems?.length ?? 0;
  const movieCount = allItems?.filter((i) => i.mediaType === "movie").length ?? 0;
  const tvCount = allItems?.filter((i) => i.mediaType === "tv").length ?? 0;

  // Client-side dual filtering
  const filteredItems = useMemo(() => {
    let items = allItems ?? [];
    if (mediaFilter !== "all") {
      items = items.filter((i) => i.mediaType === mediaFilter);
    }
    if (activeTab !== "all") {
      items = items.filter((i) => i.status === activeTab);
    }
    return items;
  }, [allItems, mediaFilter, activeTab]);

  const count = filteredItems.length;

  if (isLoading) return <WatchlistSkeleton />;

  // Contextual empty state message and CTA
  function renderEmptyState() {
    // Completely empty library
    if (totalCount === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Bookmark className="size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Your library is empty</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Start building your library by discovering movies and TV shows
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/discover">Discover Movies</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/series">Browse TV Shows</Link>
            </Button>
          </div>
        </div>
      );
    }

    // Filtered to zero — contextual messages
    if (mediaFilter === "tv") {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Bookmark className="size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No TV shows in your library yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Browse the Series page to find shows to add
          </p>
          <Button asChild>
            <Link href="/series">Browse TV Shows</Link>
          </Button>
        </div>
      );
    }

    if (mediaFilter === "movie") {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Bookmark className="size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No movies in your library yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Discover movies to add to your library
          </p>
          <Button asChild>
            <Link href="/discover">Discover Movies</Link>
          </Button>
        </div>
      );
    }

    // Status tab filtered to zero
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Bookmark className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No items with this status yet</h3>
        <p className="text-sm text-muted-foreground mb-6">
          {activeTab === "want_to_watch"
            ? "Add movies or shows you want to watch"
            : "Mark items as watched to see them here"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">My Library</h1>
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalCount}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Track movies and TV shows you want to watch and ones you&apos;ve seen
        </p>
      </div>

      {/* Filter controls — two-row layout */}
      <div className="flex flex-col gap-3">
        {/* Row 1: Media type filter */}
        <ToggleGroup
          type="single"
          value={mediaFilter}
          onValueChange={(v) => {
            if (v) setMediaFilter(v as WatchlistMediaFilter);
          }}
          className="justify-start"
        >
          <ToggleGroupItem value="all" className="text-xs h-8 px-3 rounded-full">
            All ({totalCount})
          </ToggleGroupItem>
          <ToggleGroupItem value="movie" className="text-xs h-8 px-3 rounded-full">
            Movies ({movieCount})
          </ToggleGroupItem>
          <ToggleGroupItem value="tv" className="text-xs h-8 px-3 rounded-full">
            TV Shows ({tvCount})
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Row 2: Status tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as WatchlistFilterStatus);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {count === 0 ? (
        renderEmptyState()
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={`${activeTab}-${mediaFilter}`}
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                variants={itemVariants}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              >
                <WatchlistCard item={item} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
