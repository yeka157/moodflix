"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, ExternalLink, Bookmark, CircleCheck, Loader2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import type { Movie } from "@/types/movie";
import type { WatchlistStatus } from "@/types/watchlist";
import { cn, getPosterUrl, getBackdropUrl } from "@/lib/utils";
import { GENRES } from "@/lib/constants";
import {
  useWatchlistTmdbIds,
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useUpdateWatchlistStatus,
} from "@/hooks/use-watchlist";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MovieSearchDrawerProps {
  movie: Movie | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MovieSearchDrawer({
  movie,
  open,
  onOpenChange,
}: MovieSearchDrawerProps) {
  const { data: tmdbEntries } = useWatchlistTmdbIds();
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();
  const statusMutation = useUpdateWatchlistStatus();
  const prefersReducedMotion = useReducedMotion();

  const entry = movie ? tmdbEntries?.find((e) => e.tmdbId === movie.id) : undefined;
  const status: WatchlistStatus | null = entry?.status ?? null;
  const isWantToWatch = status === "want_to_watch";
  const isWatched = status === "watched";

  const isPending =
    addMutation.isPending ||
    removeMutation.isPending ||
    statusMutation.isPending;

  const tapAnimation = prefersReducedMotion ? {} : { scale: 0.92 };

  const handleBookmarkClick = () => {
    if (!movie || isPending) return;

    if (isWantToWatch && entry) {
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
      statusMutation.mutate({ id: entry.id, status: "want_to_watch" });
    } else if (movie) {
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

  const handleCheckClick = () => {
    if (!movie || isPending) return;

    if (isWatched && entry) {
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
      statusMutation.mutate({ id: entry.id, status: "watched" });
    } else if (movie) {
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

  const year = movie?.release_date?.slice(0, 4) || null;
  const rating = movie ? movie.vote_average.toFixed(1) : null;
  const displayGenres = movie
    ? movie.genre_ids.slice(0, 4).map((id) => GENRES[id]).filter(Boolean)
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[90vw] sm:max-w-md overflow-y-auto p-0"
      >
        {movie && (
          <>
            {/* Backdrop image */}
            {movie.backdrop_path ? (
              <div className="relative h-40 w-full overflow-hidden">
                <Image
                  src={getBackdropUrl(movie.backdrop_path, "sm")}
                  alt={`${movie.title} backdrop`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 90vw, 448px"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />
              </div>
            ) : (
              <div className="h-24 w-full bg-muted" />
            )}

            <div className="p-5 space-y-4">
              {/* Title and metadata */}
              <SheetHeader className="p-0 space-y-2">
                <SheetTitle className="text-xl font-bold leading-tight pr-6">
                  {movie.title}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Movie details for {movie.title}
                </SheetDescription>
                <div className="flex items-center gap-3 flex-wrap">
                  {year && (
                    <span className="text-sm text-muted-foreground">{year}</span>
                  )}
                  {rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{rating}</span>
                    </div>
                  )}
                </div>
              </SheetHeader>

              {/* Genre badges */}
              {displayGenres.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {displayGenres.map((genre) => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Overview */}
              {movie.overview && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                  {movie.overview}
                </p>
              )}

              {/* Poster + actions row */}
              <div className="flex gap-3 items-start">
                {/* Poster thumbnail */}
                <div className="relative w-16 aspect-2/3 overflow-hidden rounded-md shrink-0 bg-muted">
                  <Image
                    src={getPosterUrl(movie.poster_path)}
                    alt={`${movie.title} poster`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>

                {/* Quick action buttons */}
                <div className="flex flex-col gap-2 flex-1">
                  <motion.button
                    className={cn(
                      "flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isWantToWatch
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80 text-foreground",
                    )}
                    onClick={handleBookmarkClick}
                    disabled={isPending}
                    whileTap={tapAnimation}
                  >
                    {addMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    ) : (
                      <Bookmark
                        className={cn("h-4 w-4 shrink-0", isWantToWatch && "fill-current")}
                      />
                    )}
                    {isWantToWatch ? "In Library" : "Want to Watch"}
                  </motion.button>

                  <motion.button
                    className={cn(
                      "flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isWatched
                        ? "bg-green-600 text-white"
                        : "bg-muted hover:bg-muted/80 text-foreground",
                    )}
                    onClick={handleCheckClick}
                    disabled={isPending}
                    whileTap={tapAnimation}
                  >
                    <CircleCheck
                      className={cn("h-4 w-4 shrink-0", isWatched && "fill-current")}
                    />
                    {isWatched ? "Watched" : "Mark as Watched"}
                  </motion.button>
                </div>
              </div>

              {/* View Full Details CTA */}
              <Button
                asChild
                className="w-full gap-2"
                onClick={() => onOpenChange(false)}
              >
                <Link href={`/movie/${movie.id}`}>
                  <ExternalLink className="h-4 w-4" />
                  View Full Details
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
