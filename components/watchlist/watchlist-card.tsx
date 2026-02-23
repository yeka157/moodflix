"use client";

import Link from "next/link";
import Image from "next/image";
import { ThumbsUp, ThumbsDown, ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import type { WatchlistItem, WatchlistStatus } from "@/types/watchlist";
import {
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useUpdateWatchlistStatus,
  useRateWatchlistItem,
} from "@/hooks/use-watchlist";
import { cn, getPosterUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_CONFIG: Record<
  WatchlistStatus,
  { label: string; className: string }
> = {
  want_to_watch: { label: "Want to Watch", className: "" },
  watched: {
    label: "Watched",
    className: "border-green-500/50 text-green-400",
  },
};

function formatAddedDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Added today";
  if (diffDays === 1) return "Added yesterday";
  if (diffDays < 30) return `Added ${diffDays}d ago`;
  if (diffDays < 365) return `Added ${Math.floor(diffDays / 30)}mo ago`;
  return `Added ${date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}

export function WatchlistCard({ item }: { item: WatchlistItem }) {
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();
  const statusMutation = useUpdateWatchlistStatus();
  const rateMutation = useRateWatchlistItem();
  const prefersReducedMotion = useReducedMotion();

  const config = STATUS_CONFIG[item.status];

  const handleStatusChange = (value: string) => {
    const newStatus = value as WatchlistStatus;
    if (newStatus === item.status) return;
    statusMutation.mutate(
      { id: item.id, status: newStatus },
      {
        onSuccess: (result) => {
          if (result.error) {
            toast.error(result.error);
          }
          // Silent on success — icon/label update is sufficient feedback
        },
      },
    );
  };

  const handleRemove = () => {
    const previousStatus = item.status;
    removeMutation.mutate(
      { id: item.id, tmdbId: item.tmdbId },
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
                    tmdbId: item.tmdbId,
                    title: item.title,
                    posterPath: item.posterPath,
                    status: previousStatus,
                  }),
              },
              duration: 5000,
            });
          }
        },
      },
    );
  };

  const handleRate = (rating: 1 | -1) => {
    const newRating = item.rating === rating ? null : rating;
    rateMutation.mutate(
      { id: item.id, rating: newRating },
      {
        onSuccess: (result) => {
          if (result.error) toast.error(result.error);
        },
      },
    );
  };

  const tapAnimation = prefersReducedMotion ? {} : { scale: 0.85 };
  const ratingSpring = prefersReducedMotion
    ? {}
    : { initial: { scale: 1.3 }, animate: { scale: 1 }, transition: { type: "spring" as const, stiffness: 400, damping: 10 } };

  return (
    <div className="flex gap-3 rounded-lg border border-border/50 bg-card p-3 transition-colors hover:border-border">
      {/* Poster — links to detail page */}
      <Link href={`/movie/${item.tmdbId}`} className="relative h-28 w-[75px] shrink-0 overflow-hidden rounded-md bg-muted block">
        <Image
          src={getPosterUrl(item.posterPath)}
          alt={`${item.title} poster`}
          fill
          className="object-cover transition-opacity hover:opacity-80"
          sizes="75px"
        />
      </Link>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold line-clamp-1">
            <Link href={`/movie/${item.tmdbId}`} className="hover:text-primary transition-colors">
              {item.title}
            </Link>
          </h3>
          <p className="text-xs text-muted-foreground">
            {formatAddedDate(item.addedAt)}
          </p>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs px-2"
                disabled={statusMutation.isPending}
              >
                <Badge
                  variant="outline"
                  className={cn("text-[10px] px-1.5 py-0 h-4", config.className)}
                >
                  {config.label}
                </Badge>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup
                value={item.status}
                onValueChange={handleStatusChange}
              >
                <DropdownMenuRadioItem value="want_to_watch">
                  Want to Watch
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="watched">
                  Watched
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={handleRemove}
                disabled={removeMutation.isPending}
              >
                Remove from Library
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Like/Dislike */}
          <div className="flex items-center gap-0.5">
            <motion.div whileTap={tapAnimation}>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleRate(1)}
                disabled={rateMutation.isPending}
                aria-label="Like"
              >
                <motion.div
                  key={`like-${item.rating === 1}`}
                  {...(item.rating === 1 ? ratingSpring : {})}
                >
                  <ThumbsUp
                    className={cn(
                      "h-3.5 w-3.5",
                      item.rating === 1 && "fill-green-500 text-green-500",
                    )}
                  />
                </motion.div>
              </Button>
            </motion.div>
            <motion.div whileTap={tapAnimation}>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleRate(-1)}
                disabled={rateMutation.isPending}
                aria-label="Dislike"
              >
                <motion.div
                  key={`dislike-${item.rating === -1}`}
                  {...(item.rating === -1 ? ratingSpring : {})}
                >
                  <ThumbsDown
                    className={cn(
                      "h-3.5 w-3.5",
                      item.rating === -1 && "fill-red-500 text-red-500",
                    )}
                  />
                </motion.div>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
