"use client";

import Image from "next/image";
import { ThumbsUp, ThumbsDown, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { WatchlistItem, WatchlistStatus } from "@/types/watchlist";
import {
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
  const removeMutation = useRemoveFromWatchlist();
  const statusMutation = useUpdateWatchlistStatus();
  const rateMutation = useRateWatchlistItem();

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
          } else {
            toast.success(`Status updated to "${STATUS_CONFIG[newStatus].label}"`);
          }
        },
      },
    );
  };

  const handleRemove = () => {
    removeMutation.mutate(
      { id: item.id, tmdbId: item.tmdbId },
      {
        onSuccess: (result) => {
          if (result.error) {
            toast.error(result.error);
          } else {
            toast.success(`Removed "${item.title}"`);
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

  return (
    <div className="flex gap-3 rounded-lg border border-border/50 bg-card p-3 transition-colors hover:border-border">
      {/* Poster */}
      <div className="relative h-28 w-[75px] shrink-0 overflow-hidden rounded-md bg-muted">
        <Image
          src={getPosterUrl(item.posterPath)}
          alt={item.title}
          fill
          className="object-cover"
          sizes="75px"
        />
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold line-clamp-1">{item.title}</h3>
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
                Remove from Watchlist
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Like/Dislike */}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleRate(1)}
              disabled={rateMutation.isPending}
              aria-label="Like"
            >
              <ThumbsUp
                className={cn(
                  "h-3.5 w-3.5",
                  item.rating === 1 && "fill-green-500 text-green-500",
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleRate(-1)}
              disabled={rateMutation.isPending}
              aria-label="Dislike"
            >
              <ThumbsDown
                className={cn(
                  "h-3.5 w-3.5",
                  item.rating === -1 && "fill-red-500 text-red-500",
                )}
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
