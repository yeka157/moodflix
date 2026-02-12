"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { WatchlistFilterStatus, WatchlistStatus } from "@/types/watchlist";
import { useWatchlist } from "@/hooks/use-watchlist";
import { WatchlistCard } from "./watchlist-card";
import { WatchlistSkeleton } from "./watchlist-skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [activeTab, setActiveTab] =
    useState<WatchlistFilterStatus>("all");

  const statusFilter: WatchlistStatus | undefined =
    activeTab === "all" ? undefined : activeTab;
  const { data: items, isLoading } = useWatchlist(statusFilter);

  const count = items?.length ?? 0;

  if (isLoading) return <WatchlistSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Your Watchlist</h1>
          {count > 0 && (
            <Badge variant="secondary" className="text-xs">
              {count}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Track movies you want to watch and ones you&apos;ve seen
        </p>
      </div>

      {/* Tabs */}
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

      {/* Content */}
      {count === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Bookmark className="size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No movies here yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {activeTab === "all"
              ? "Start building your watchlist by discovering movies"
              : `No movies with "${TABS.find((t) => t.value === activeTab)?.label}" status`}
          </p>
          <Button asChild>
            <Link href="/discover">Discover Movies</Link>
          </Button>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={activeTab}
        >
          <AnimatePresence mode="popLayout">
            {items?.map((item) => (
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
