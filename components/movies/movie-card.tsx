"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Star, Bookmark, CircleCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Movie } from "@/types/movie";
import type { WatchlistStatus } from "@/types/watchlist";
import { cn, getPosterUrl } from "@/lib/utils";
import { GENRES } from "@/lib/constants";
import {
  useWatchlistTmdbIds,
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useUpdateWatchlistStatus,
} from "@/hooks/use-watchlist";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface MovieCardProps {
  movie: Movie;
  priority?: boolean;
  className?: string;
  onClick?: (movie: Movie) => void;
  href?: string;
  readOnly?: boolean;
}

export function MovieCard({
  movie,
  priority = false,
  className,
  onClick,
  href,
  readOnly = false,
}: MovieCardProps) {
  const year = movie.release_date?.slice(0, 4) || "N/A";
  const rating = movie.vote_average.toFixed(1);
  const displayGenres = movie.genre_ids
    .slice(0, 2)
    .map((id) => GENRES[id])
    .filter(Boolean);

  const { data: tmdbEntries } = useWatchlistTmdbIds();
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();
  const statusMutation = useUpdateWatchlistStatus();

  const entry = tmdbEntries?.find((e) => e.tmdbId === movie.id);
  const status: WatchlistStatus | null = entry?.status ?? null;
  const isWantToWatch = status === "want_to_watch";
  const isWatched = status === "watched";
  const isInLibrary = status !== null;

  const prefersReducedMotion = useReducedMotion();

  const isPending =
    addMutation.isPending ||
    removeMutation.isPending ||
    statusMutation.isPending;

  const tapAnimation = prefersReducedMotion ? {} : { scale: 0.85 };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isPending) return;

    if (isWantToWatch && entry) {
      // Remove from library
      removeMutation.mutate(
        { id: entry.id, tmdbId: movie.id },
        {
          onSuccess: (result) => {
            if (result.error) {
              toast.error(result.error);
            } else {
              toast("Removed from library", {
                action: {
                  label: "Undo",
                  onClick: () =>
                    addMutation.mutate({
                      tmdbId: movie.id,
                      title: movie.title,
                      posterPath: movie.poster_path,
                      status: "want_to_watch",
                    }),
                },
                duration: 5000,
              });
            }
          },
        },
      );
    } else if (isWatched && entry) {
      // Switch from watched → want to watch
      statusMutation.mutate({ id: entry.id, status: "want_to_watch" });
    } else {
      // Add as want to watch
      addMutation.mutate(
        {
          tmdbId: movie.id,
          title: movie.title,
          posterPath: movie.poster_path,
          status: "want_to_watch",
        },
        {
          onSuccess: (result) => {
            if (result.error) toast.error(result.error);
          },
          onError: () => toast.error("Failed to add to library"),
        },
      );
    }
  };

  const handleCheckClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isPending) return;

    if (isWatched && entry) {
      // Remove from library
      removeMutation.mutate(
        { id: entry.id, tmdbId: movie.id },
        {
          onSuccess: (result) => {
            if (result.error) {
              toast.error(result.error);
            } else {
              toast("Removed from library", {
                action: {
                  label: "Undo",
                  onClick: () =>
                    addMutation.mutate({
                      tmdbId: movie.id,
                      title: movie.title,
                      posterPath: movie.poster_path,
                      status: "watched",
                    }),
                },
                duration: 5000,
              });
            }
          },
        },
      );
    } else if (isWantToWatch && entry) {
      // Switch from want to watch → watched
      statusMutation.mutate({ id: entry.id, status: "watched" });
    } else {
      // Add as watched
      addMutation.mutate(
        {
          tmdbId: movie.id,
          title: movie.title,
          posterPath: movie.poster_path,
          status: "watched",
        },
        {
          onSuccess: (result) => {
            if (result.error) toast.error(result.error);
          },
          onError: () => toast.error("Failed to add to library"),
        },
      );
    }
  };

  const cardContent = (
    <div className="relative aspect-2/3 overflow-hidden rounded-lg">
      <Image
        src={getPosterUrl(movie.poster_path)}
        alt={movie.title}
        fill
        priority={priority}
        className="object-cover"
        sizes="(max-width: 640px) 150px, (max-width: 768px) 170px, 185px"
      />

      {/* Action icons */}
      {!readOnly && <div
        className={cn(
          "absolute top-2 right-2 z-10 flex flex-col gap-1.5 transition-opacity duration-200",
          isInLibrary ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        {/* Bookmark (want to watch) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              className={cn(
                "flex items-center justify-center h-8 w-8 [@media(hover:none)]:h-11 [@media(hover:none)]:w-11 rounded-full transition-colors duration-200",
                isWantToWatch
                  ? "bg-primary text-primary-foreground"
                  : "bg-black/60 hover:bg-black/80 text-white",
              )}
              onClick={handleBookmarkClick}
              disabled={isPending}
              whileTap={tapAnimation}
              aria-label={
                isWantToWatch
                  ? "Remove from library"
                  : "Add to library"
              }
            >
              {addMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <motion.span
                  key={`bookmark-${isWantToWatch}`}
                  initial={!prefersReducedMotion && isWantToWatch ? { scale: 0.5, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="flex items-center justify-center"
                >
                  <Bookmark
                    className={cn(
                      "h-4 w-4",
                      isWantToWatch && "fill-current",
                    )}
                  />
                </motion.span>
              )}
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {isWantToWatch
              ? "Remove from library"
              : isWatched
                ? "Move to want to watch"
                : "Want to watch"}
          </TooltipContent>
        </Tooltip>

        {/* Check (watched) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              className={cn(
                "flex items-center justify-center h-8 w-8 [@media(hover:none)]:h-11 [@media(hover:none)]:w-11 rounded-full transition-colors duration-200",
                isWatched
                  ? "bg-green-600 text-white"
                  : "bg-black/60 hover:bg-black/80 text-white",
              )}
              onClick={handleCheckClick}
              disabled={isPending}
              whileTap={tapAnimation}
              aria-label={
                isWatched
                  ? "Remove from watched"
                  : "Mark as watched"
              }
            >
              <motion.span
                key={`check-${isWatched}`}
                initial={!prefersReducedMotion && isWatched ? { scale: 0.5, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                className="flex items-center justify-center"
              >
                <CircleCheck
                  className={cn(
                    "h-4 w-4",
                    isWatched && "fill-current",
                  )}
                />
              </motion.span>
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {isWatched
              ? "Remove from watched"
              : isWantToWatch
                ? "Mark as watched"
                : "Mark as watched"}
          </TooltipContent>
        </Tooltip>
      </div>}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
          <h3 className="text-sm font-semibold text-white line-clamp-2">
            {movie.title}
          </h3>

          <div className="flex items-center gap-2 text-xs text-white/90">
            <span>{year}</span>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{rating}</span>
            </div>
          </div>

          {displayGenres.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {displayGenres.map((genre) => (
                <Badge
                  key={genre}
                  variant="secondary"
                  className="bg-white/20 text-white border-0 text-[10px] px-1.5 py-0 h-4"
                >
                  {genre}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={cn("group relative cursor-pointer block", className)}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {cardContent}
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.div
      className={cn("group relative cursor-pointer", className)}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={() => onClick?.(movie)}
    >
      {cardContent}
    </motion.div>
  );
}
