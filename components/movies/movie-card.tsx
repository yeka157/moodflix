"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Star,
  Bookmark,
  Bell,
  BellRing,
  CircleCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { Movie } from "@/types/movie";
import type { WatchlistStatus } from "@/types/watchlist";
import type { MediaType } from "@/types/media";
import { cn, getPosterUrl } from "@/lib/utils";
import { GENRES } from "@/lib/constants";
import {
  useWatchlistTmdbIds,
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useUpdateWatchlistStatus,
} from "@/hooks/use-watchlist";
import {
  usePushSubscription,
  useNotificationSubscription,
} from "@/hooks/use-push-subscription";
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
  onHover?: (movie: Movie) => void;
  href?: string;
  readOnly?: boolean;
  mediaType?: MediaType;
  releaseDateBadge?: string | null;
  hideWatchedButton?: boolean;
  rank?: number;
}

export function MovieCard({
  movie,
  priority = false,
  className,
  onClick,
  onHover,
  href,
  readOnly = false,
  mediaType = "movie",
  releaseDateBadge,
  hideWatchedButton = false,
  rank,
}: MovieCardProps) {
  const year = movie.release_date?.slice(0, 4) || "—";
  const rating = movie.vote_average?.toFixed(1) ?? null;
  const firstGenre = movie.genre_ids?.slice(0, 1).map((id) => GENRES[id])[0];

  const { data: tmdbEntries } = useWatchlistTmdbIds();
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();
  const statusMutation = useUpdateWatchlistStatus();

  const entry = tmdbEntries?.find(
    (e) => e.tmdbId === movie.id && e.mediaType === mediaType,
  );
  const status: WatchlistStatus | null = entry?.status ?? null;
  const isWantToWatch = status === "want_to_watch";
  const isWatched = status === "watched";
  const isInLibrary = status !== null;

  const { subscribe: subscribePush, isSupported: isPushSupported } =
    usePushSubscription();
  const {
    isSubscribed: isNotifySubscribed,
    toggle: toggleNotify,
    isLoading: isNotifyLoading,
    isToggling: isNotifyToggling,
  } = useNotificationSubscription(hideWatchedButton ? movie.id : 0);

  const isPending =
    addMutation.isPending ||
    removeMutation.isPending ||
    statusMutation.isPending;
  const isNotifyBusy = isNotifyLoading || isNotifyToggling;

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isPending) return;

    if (isWantToWatch && entry) {
      removeMutation.mutate(
        { id: entry.id, tmdbId: movie.id, mediaType },
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
                      mediaType,
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
    } else {
      addMutation.mutate(
        {
          tmdbId: movie.id,
          title: movie.title,
          posterPath: movie.poster_path,
          status: "want_to_watch",
          mediaType,
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
      removeMutation.mutate(
        { id: entry.id, tmdbId: movie.id, mediaType },
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
                      mediaType,
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
    } else {
      addMutation.mutate(
        {
          tmdbId: movie.id,
          title: movie.title,
          posterPath: movie.poster_path,
          status: "watched",
          mediaType,
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

  const handleBellClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isNotifyBusy) return;

    if (!isNotifySubscribed) {
      const sub = await subscribePush();
      if (!sub) return;
    }

    toggleNotify({
      tmdbId: movie.id,
      title: movie.title,
      posterPath: movie.poster_path,
      releaseDate: movie.release_date ?? null,
    });
  };

  const quickAlwaysOn = isInLibrary || isNotifySubscribed;

  const inner = (
    <>
      <div className="card-poster">
        <Image
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 170px, (max-width: 900px) 200px, 232px"
        />

        {rank != null && <div className="card-rank">{rank}</div>}

        {!rank && releaseDateBadge && (
          <div className="card-release">{releaseDateBadge}</div>
        )}

        {!releaseDateBadge && rating && (
          <div className="card-rating">
            <Star fill="currentColor" />
            <span>{rating}</span>
          </div>
        )}

        {!readOnly && (
          <div
            className={cn("card-quick", quickAlwaysOn && "always-on")}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(isWantToWatch && "on")}
                  onClick={handleBookmarkClick}
                  disabled={isPending}
                  aria-label={
                    isWantToWatch
                      ? "Remove from library"
                      : "Add to library"
                  }
                >
                  {addMutation.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Bookmark fill={isWantToWatch ? "currentColor" : "none"} />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isWantToWatch
                  ? "Remove from library"
                  : isWatched
                    ? "Move to want to watch"
                    : "Want to watch"}
              </TooltipContent>
            </Tooltip>

            {hideWatchedButton && isPushSupported && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn("alt", isNotifySubscribed && "on")}
                    onClick={handleBellClick}
                    aria-label={
                      isNotifySubscribed
                        ? "Cancel release notification"
                        : "Notify me when released"
                    }
                  >
                    {isNotifySubscribed ? (
                      <BellRing fill="currentColor" />
                    ) : (
                      <Bell />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {isNotifySubscribed
                    ? "Cancel release notification"
                    : "Notify me when released"}
                </TooltipContent>
              </Tooltip>
            )}

            {!hideWatchedButton && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn("alt", isWatched && "on")}
                    onClick={handleCheckClick}
                    disabled={isPending}
                    aria-label={
                      isWatched ? "Remove from watched" : "Mark as watched"
                    }
                  >
                    <CircleCheck
                      fill={isWatched ? "currentColor" : "none"}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {isWatched ? "Remove from watched" : "Mark as watched"}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>

      <div className="card-meta">
        <p className="card-title">{movie.title}</p>
        <div className="card-sub">
          <span>{year}</span>
          {firstGenre && (
            <>
              <span className="dot" />
              <span>{firstGenre}</span>
            </>
          )}
        </div>
      </div>
    </>
  );

  const hoverProps = onHover
    ? { onMouseEnter: () => onHover(movie), onFocus: () => onHover(movie) }
    : {};

  if (href) {
    return (
      <Link href={href} className={cn("card", className)} {...hoverProps}>
        {inner}
      </Link>
    );
  }

  return (
    <div
      className={cn("card", className)}
      onClick={() => onClick?.(movie)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(movie);
        }
      }}
      {...hoverProps}
    >
      {inner}
    </div>
  );
}
