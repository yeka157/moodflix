"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bookmark, ThumbsUp, ThumbsDown, Share2, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  WatchlistItem,
  WatchlistFilterStatus,
  WatchlistMediaFilter,
} from "@/types/watchlist";
import { useWatchlist } from "@/hooks/use-watchlist";
import { WatchlistCard } from "./watchlist-card";
import { WatchlistSkeleton } from "./watchlist-skeleton";
import { cn, getPosterUrl } from "@/lib/utils";

type Tab = "want_to_watch" | "watched";
const TABS: { value: Tab; label: string }[] = [
  { value: "want_to_watch", label: "Want to watch" },
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

function formatTimelineDate(iso: string): { mmm: string; year: string } {
  const d = new Date(iso);
  const mmm = d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  return { mmm: mmm.toUpperCase(), year: String(d.getFullYear()) };
}

function pad(n: number, len = 3) {
  return String(n).padStart(len, "0");
}

export function WatchlistContent() {
  const [activeTab, setActiveTab] = useState<Tab>("want_to_watch");
  const [mediaFilter, setMediaFilter] = useState<WatchlistMediaFilter>("all");

  const { data: allItems, isLoading } = useWatchlist();

  const totalCount = allItems?.length ?? 0;
  const movieCount = allItems?.filter((i) => i.mediaType === "movie").length ?? 0;
  const tvCount = allItems?.filter((i) => i.mediaType === "tv").length ?? 0;
  const wantCount = allItems?.filter((i) => i.status === "want_to_watch").length ?? 0;
  const watchedCount = allItems?.filter((i) => i.status === "watched").length ?? 0;

  const filteredItems = useMemo(() => {
    let items = allItems ?? [];
    if (mediaFilter !== "all") {
      items = items.filter((i) => i.mediaType === mediaFilter);
    }
    items = items.filter((i) => i.status === activeTab);
    return items;
  }, [allItems, mediaFilter, activeTab]);

  // Sort watched items by watchedAt descending (latest first)
  const sortedWatched = useMemo(() => {
    if (activeTab !== "watched") return filteredItems;
    return [...filteredItems].sort((a, b) => {
      const aTime = a.watchedAt ?? a.addedAt;
      const bTime = b.watchedAt ?? b.addedAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [filteredItems, activeTab]);

  if (isLoading) return <WatchlistSkeleton />;

  const count = filteredItems.length;

  function renderEmptyState() {
    if (totalCount === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Bookmark className="size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Your library is empty</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Start building your library by discovering movies and TV shows
          </p>
          <div className="flex gap-3">
            <Link href="/discover" className="btn btn-red">
              Discover movies
            </Link>
            <Link href="/series" className="btn btn-outline">
              Browse TV shows
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Bookmark className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {activeTab === "want_to_watch"
            ? "Nothing on your watchlist yet"
            : "No watched titles yet"}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {activeTab === "want_to_watch"
            ? "Add movies or shows you want to watch"
            : "Mark items as watched to see them here"}
        </p>
        <Link href="/discover" className="btn btn-outline">
          Discover more
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="section-eyebrow">
          <span className="bar" />
          <span className="id">
            YOUR LIBRARY · {pad(totalCount)} TITLES
          </span>
        </div>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <h1
            className="display"
            style={{ fontSize: "clamp(56px, 7vw, 104px)", margin: 0 }}
          >
            My{" "}
            <span
              className="serif-it"
              style={{
                color: "var(--ink-2)",
                textTransform: "none",
                letterSpacing: "-0.015em",
              }}
            >
              library.
            </span>
          </h1>
          <div className="flex gap-7 items-end">
            <LibStat label="Films" value={movieCount} />
            <LibStat label="Series" value={tvCount} />
            <LibStat label="Watched" value={watchedCount} tone="red" />
          </div>
        </div>
      </div>

      {/* Media filter chips */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-[9px] rounded-full border border-border bg-card text-[12.5px] text-[var(--ink-2)] transition-[border-color,background-color,color] duration-200 hover:text-foreground hover:border-[var(--ink-4)] cursor-pointer font-[inherit]",
            mediaFilter === "all" && "bg-foreground text-background border-foreground",
          )}
          onClick={() => setMediaFilter("all")}
        >
          All <span className="font-mono text-[10px] opacity-70">·{totalCount}</span>
        </button>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-[9px] rounded-full border border-border bg-card text-[12.5px] text-[var(--ink-2)] transition-[border-color,background-color,color] duration-200 hover:text-foreground hover:border-[var(--ink-4)] cursor-pointer font-[inherit]",
            mediaFilter === "movie" && "bg-foreground text-background border-foreground",
          )}
          onClick={() => setMediaFilter("movie")}
        >
          Films <span className="font-mono text-[10px] opacity-70">·{movieCount}</span>
        </button>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-[9px] rounded-full border border-border bg-card text-[12.5px] text-[var(--ink-2)] transition-[border-color,background-color,color] duration-200 hover:text-foreground hover:border-[var(--ink-4)] cursor-pointer font-[inherit]",
            mediaFilter === "tv" && "bg-foreground text-background border-foreground",
          )}
          onClick={() => setMediaFilter("tv")}
        >
          Series <span className="font-mono text-[10px] opacity-70">·{tvCount}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-8 border-b border-border items-center flex-wrap">
        {TABS.map((t) => {
          const tabCount =
            t.value === "want_to_watch" ? wantCount : watchedCount;
          const isActive = activeTab === t.value;
          return (
            <button
              key={t.value}
              type="button"
              className={cn(
                "relative inline-flex items-center gap-2 px-[18px] py-3.5 text-[13px] font-medium text-muted-foreground transition-colors bg-transparent border-0 cursor-pointer font-[inherit] hover:text-[var(--ink-2)]",
                isActive &&
                  "text-foreground after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-px after:h-0.5 after:bg-primary",
              )}
              onClick={() => setActiveTab(t.value)}
            >
              {t.label}
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-full bg-card text-[var(--ink-2)]">{tabCount}</span>
            </button>
          );
        })}
        <div className="ml-auto flex gap-2 py-2">
          <button type="button" className="btn btn-ghost" disabled>
            <SlidersHorizontal size={14} />
            Filters
          </button>
          <button type="button" className="btn btn-ghost" disabled>
            <Share2 size={14} />
            Share list
          </button>
        </div>
      </div>

      {/* Content */}
      {count === 0 ? (
        renderEmptyState()
      ) : activeTab === "want_to_watch" ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={`want-${mediaFilter}`}
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
      ) : (
        <WatchedTimeline items={sortedWatched} />
      )}
    </>
  );
}

function LibStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "red";
}) {
  return (
    <div className="text-right">
      <div className="eyebrow">{label}</div>
      <div
        className="tnum"
        style={{
          fontFamily: "var(--font-display), Inter, sans-serif",
          fontSize: 36,
          lineHeight: 0.9,
          marginTop: 4,
          color: tone === "red" ? "var(--red)" : "var(--ink)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function WatchedTimeline({ items }: { items: WatchlistItem[] }) {
  return (
    <div className="lib-timeline">
      {items.map((item) => {
        const ts = item.watchedAt ?? item.addedAt;
        const { mmm, year } = formatTimelineDate(ts);
        const detailHref =
          item.mediaType === "tv"
            ? `/tv/${item.tmdbId}`
            : `/movie/${item.tmdbId}`;
        return (
          <div key={item.id} className="lib-timeline-row reveal">
            <div className="lib-timeline-meta">
              <div className="lib-timeline-dot" />
              <div className="lib-timeline-date">{mmm}</div>
              <div className="lib-timeline-year">{year}</div>
            </div>
            <Link href={detailHref} className="lib-timeline-card">
              <Image
                src={getPosterUrl(item.posterPath)}
                alt={item.title}
                width={80}
                height={120}
                className="poster"
              />
              <div className="min-w-0">
                <h4 className="lib-title">{item.title}</h4>
                <div className="lib-sub">
                  {item.mediaType === "tv" ? "Series" : "Film"} · Added{" "}
                  {new Date(item.addedAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <p className="lib-note">
                  {item.rating === 1
                    ? "Liked it. Worth a rewatch."
                    : item.rating === -1
                      ? "Not for me — left me cold."
                      : "Watched and logged."}
                </p>
              </div>
              <div className="lib-timeline-rating">
                {item.rating === 1 && (
                  <>
                    <div className="v">
                      <ThumbsUp
                        className="inline size-4 mr-1"
                        fill="currentColor"
                      />
                      Liked
                    </div>
                    <div className="eyebrow mt-1">my rating</div>
                  </>
                )}
                {item.rating === -1 && (
                  <>
                    <div className="v">
                      <ThumbsDown
                        className="inline size-4 mr-1"
                        fill="currentColor"
                      />
                      Disliked
                    </div>
                    <div className="eyebrow mt-1">my rating</div>
                  </>
                )}
                {item.rating == null && (
                  <div className="eyebrow">unrated</div>
                )}
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

// Preserved for future use when "watching" tracking is added
export type { WatchlistFilterStatus };
