"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Star,
  Clock,
  X,
  Bookmark,
  CircleCheck,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import type { Movie, MovieDetailsResponse } from "@/types/movie";
import type { TVDetailsResponse, TVSeason } from "@/types/tv";
import { useMovieDetails } from "@/hooks/use-movies";
import { useTVDetails } from "@/hooks/use-tv";
import {
  useWatchlistCheck,
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useUpdateWatchlistStatus,
  useRateWatchlistItem,
} from "@/hooks/use-watchlist";
import { cn, getBackdropUrl } from "@/lib/utils";
import { TMDB_IMAGE_BASE, PROVIDER_URLS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface MovieDetailModalProps {
  movie: Movie | null;
  onClose: () => void;
  readOnly?: boolean;
  mediaType?: "movie" | "tv";
}

function formatRuntime(minutes: number | null): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Returning Series": return "default";
    case "Ended":            return "secondary";
    case "Canceled":         return "destructive";
    case "In Production":    return "outline";
    case "Planned":          return "outline";
    case "Pilot":            return "outline";
    default:                 return "secondary";
  }
}

function ProviderGrid({
  providers,
}: {
  providers: {
    logo_path: string;
    provider_name: string;
    provider_id: number;
  }[];
}) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
      {providers.map((p) => {
        const url = PROVIDER_URLS[p.provider_id];
        const content = (
          <>
            <div className="relative h-12 w-12 overflow-hidden rounded-lg">
              <Image
                src={`${TMDB_IMAGE_BASE}/w92${p.logo_path}`}
                alt={p.provider_name}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <span className="text-[10px] text-muted-foreground text-center line-clamp-1">
              {p.provider_name}
            </span>
          </>
        );

        return url ? (
          <a
            key={p.provider_id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 transition-opacity hover:opacity-80"
          >
            {content}
          </a>
        ) : (
          <div
            key={p.provider_id}
            className="flex flex-col items-center gap-1.5"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-video w-full rounded-t-lg" />
      <div className="px-6 space-y-3">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

const SEASONS_COLLAPSED_COUNT = 5;

function SeasonsSection({ seasons }: { seasons: TVSeason[] }) {
  const [expanded, setExpanded] = useState(false);
  const reversedSeasons = [...seasons].reverse();
  const needsCollapse = reversedSeasons.length > SEASONS_COLLAPSED_COUNT;
  const visibleSeasons = needsCollapse && !expanded
    ? reversedSeasons.slice(0, SEASONS_COLLAPSED_COUNT)
    : reversedSeasons;
  const latestSeasonNumber = Math.max(...seasons.map((s) => s.season_number));

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">
        Seasons ({seasons.length})
      </h3>
      <div className="space-y-2">
        {visibleSeasons.map((season) => {
          const isLatest = season.season_number === latestSeasonNumber;
          return (
            <div
              key={season.id}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2",
                isLatest
                  ? "bg-accent/10 ring-1 ring-accent/30"
                  : "bg-muted/50",
              )}
            >
              {season.poster_path ? (
                <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded">
                  <Image
                    src={`${TMDB_IMAGE_BASE}/w92${season.poster_path}`}
                    alt={season.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ) : (
                <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground">
                  S{season.season_number}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {season.name}
                  </span>
                  {isLatest && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">
                      Latest
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{season.episode_count} episodes</span>
                  {season.air_date && (
                    <>
                      <span className="text-muted-foreground/50">·</span>
                      <span>{season.air_date.slice(0, 4)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {needsCollapse && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            Show all {reversedSeasons.length} seasons
          </button>
        )}
        {needsCollapse && expanded && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <ChevronDown className="h-3.5 w-3.5 rotate-180" />
            Show less
          </button>
        )}
      </div>
    </div>
  );
}

export function MovieDetailModal({ movie, onClose, readOnly = false, mediaType = "movie" }: MovieDetailModalProps) {
  const isTV = mediaType === "tv";

  // Movie details — disabled when TV (both hooks always called: React rules)
  const {
    data: movieDetails,
    isLoading: isMovieLoading,
    isPlaceholderData: isMoviePlaceholder,
  } = useMovieDetails(isTV ? null : (movie?.id ?? null));

  // TV details — disabled when movie
  const {
    data: tvDetails,
    isLoading: isTVLoading,
  } = useTVDetails(isTV ? (movie?.id ?? null) : null);

  // Unified references
  const details = isTV ? tvDetails : movieDetails;
  const isDetailLoading = isTV ? isTVLoading : (isMovieLoading || isMoviePlaceholder);

  const year = movie?.release_date?.slice(0, 4) || "N/A";
  const rating =
    details?.vote_average?.toFixed(1) ??
    movie?.vote_average?.toFixed(1) ??
    "0.0";

  // TV-specific derived data
  const tvData = isTV ? (details as TVDetailsResponse | undefined) : undefined;
  const creators = tvData?.created_by ?? [];
  const creatorNames = creators.map((c) => c.name).join(", ");
  const networks = tvData?.networks ?? [];
  const networkNames = networks.map((n) => n.name).join(", ");
  const numberOfSeasons = tvData?.number_of_seasons ?? null;
  const numberOfEpisodes = tvData?.number_of_episodes ?? null;
  const showStatus = tvData?.status ?? null;
  const seasons: TVSeason[] = (tvData?.seasons ?? []).filter(
    (s) => s.season_number > 0,
  );

  // Movie-specific derived data
  const movieData = !isTV ? (details as MovieDetailsResponse | undefined) : undefined;
  const director = movieData?.credits?.crew?.find((c) => c.job === "Director");
  const runtime = movieData ? formatRuntime(movieData.runtime) : "";

  const cast = details?.credits?.cast?.slice(0, 8) ?? [];
  const genres = details?.genres ?? [];
  const watchProviders = details?.watchProviders;
  const hasStream = (watchProviders?.flatrate?.length ?? 0) > 0;
  const hasRent = (watchProviders?.rent?.length ?? 0) > 0;
  const hasBuy = (watchProviders?.buy?.length ?? 0) > 0;
  const hasAnyProvider = hasStream || hasRent || hasBuy;
  const defaultTab = hasStream ? "stream" : hasRent ? "rent" : "buy";

  const { data: watchlistItem, isLoading: isCheckingWatchlist } =
    useWatchlistCheck(movie?.id ?? 0, mediaType);
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();
  const statusMutation = useUpdateWatchlistStatus();
  const rateMutation = useRateWatchlistItem();
  const prefersReducedMotion = useReducedMotion();

  const tapAnimation = prefersReducedMotion ? {} : { scale: 0.85 };

  const isInLibrary = !!watchlistItem;
  const isWantToWatch = watchlistItem?.status === "want_to_watch";
  const isWatched = watchlistItem?.status === "watched";

  const handleAddToLibrary = () => {
    if (!movie) return;
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
  };

  const handleMarkWatched = () => {
    if (!movie) return;
    if (isWantToWatch && watchlistItem) {
      // Switch status
      statusMutation.mutate({ id: watchlistItem.id, status: "watched" });
    } else {
      // Add directly as watched
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
          onError: () => toast.error("Failed to mark as watched"),
        },
      );
    }
  };

  const handleRemove = () => {
    if (!watchlistItem || !movie) return;
    const previousStatus = watchlistItem.status;
    removeMutation.mutate(
      { id: watchlistItem.id, tmdbId: watchlistItem.tmdbId, mediaType },
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
                    status: previousStatus,
                    mediaType,
                  }),
              },
              duration: 5000,
            });
          }
        },
      },
    );
  };

  const handleMoveToWantToWatch = () => {
    if (!watchlistItem) return;
    statusMutation.mutate({ id: watchlistItem.id, status: "want_to_watch" });
  };

  return (
    <Dialog open={movie !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[calc(100%-1rem)] sm:max-w-[90vw] md:max-w-2xl p-0 gap-0 overflow-hidden border-border/50 bg-background"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          {movie?.title ?? (isTV ? "TV Show Details" : "Movie Details")}
        </DialogTitle>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 z-20 rounded-full bg-black/60 hover:bg-black/80 text-white h-8 w-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="max-h-[90dvh] md:max-h-[85dvh] overflow-y-auto">
          {!movie ? (
            <DetailSkeleton />
          ) : (
            <div>
              {/* Backdrop */}
              <div className="relative aspect-video w-full">
                <Image
                  src={getBackdropUrl(
                    movie.backdrop_path ?? details?.backdrop_path ?? null,
                    "md",
                  )}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 672px) 100vw, 672px"
                  priority
                />
                <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" />

                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white line-clamp-2">
                    {movie.title}
                  </h2>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 pb-6 space-y-5">
                {/* Meta row */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                  <span className="text-foreground font-medium">{year}</span>

                  {/* Runtime — movie only */}
                  {!isTV && (
                    isDetailLoading && !runtime ? (
                      <Skeleton className="h-4 w-12" />
                    ) : runtime ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {runtime}
                      </span>
                    ) : null
                  )}

                  {/* TV meta info — seasons and episodes */}
                  {isTV && numberOfSeasons !== null && (
                    <span>{numberOfSeasons} {numberOfSeasons === 1 ? "Season" : "Seasons"}</span>
                  )}
                  {isTV && numberOfEpisodes !== null && (
                    <span>{numberOfEpisodes} Episodes</span>
                  )}

                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    {rating}
                  </span>
                  {isDetailLoading && !details?.watchCountry ? (
                    <Skeleton className="h-5 w-10" />
                  ) : details?.watchCountry ? (
                    <Badge variant="outline" className="text-xs">
                      {details.watchCountry}
                    </Badge>
                  ) : null}

                  {/* Status badge — TV only */}
                  {isTV && showStatus && (
                    <Badge variant={getStatusBadgeVariant(showStatus)} className="text-xs">
                      {showStatus}
                    </Badge>
                  )}
                </div>

                {/* Tagline */}
                {isDetailLoading && !details?.tagline ? (
                  <Skeleton className="h-4 w-3/4" />
                ) : details?.tagline ? (
                  <p className="text-sm italic text-muted-foreground">
                    &ldquo;{details.tagline}&rdquo;
                  </p>
                ) : null}

                {/* Overview */}
                <p className="text-sm leading-relaxed">
                  {details?.overview || movie.overview}
                </p>

                {/* Genres */}
                <div className="flex gap-2 flex-wrap">
                  {isDetailLoading && genres.length === 0 ? (
                    <>
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </>
                  ) : (
                    genres.map((g) => (
                      <Badge key={g.id} variant="secondary" className="text-xs">
                        {g.name}
                      </Badge>
                    ))
                  )}
                </div>

                {/* Library Actions */}
                {!readOnly && (
                <div className="space-y-3">
                  {isCheckingWatchlist ? (
                    <Skeleton className="h-9 w-64" />
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Bookmark / Add to Library button */}
                        {isWantToWatch ? (
                          <Button
                            size="sm"
                            className="gap-2"
                            onClick={handleRemove}
                            disabled={removeMutation.isPending}
                          >
                            {removeMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Bookmark className="h-4 w-4 fill-current" />
                            )}
                            In Library
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={
                              isWatched
                                ? handleMoveToWantToWatch
                                : handleAddToLibrary
                            }
                            disabled={
                              addMutation.isPending || statusMutation.isPending
                            }
                          >
                            {addMutation.isPending ||
                            statusMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                            {isWatched ? "Want to Watch" : "Add to Library"}
                          </Button>
                        )}

                        {/* Check / Mark as Watched button */}
                        {isWatched ? (
                          <Button
                            size="sm"
                            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleRemove}
                            disabled={removeMutation.isPending}
                          >
                            {removeMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CircleCheck className="h-4 w-4 fill-current" />
                            )}
                            Watched
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={handleMarkWatched}
                            disabled={
                              addMutation.isPending || statusMutation.isPending
                            }
                          >
                            {statusMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CircleCheck className="h-4 w-4" />
                            )}
                            Mark as Watched
                          </Button>
                        )}
                      </div>

                      {/* Like/Dislike — only show when in library */}
                      {isInLibrary && (
                        <div className="flex items-center gap-1">
                          <motion.div whileTap={tapAnimation}>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                const newRating =
                                  watchlistItem.rating === 1 ? null : 1;
                                rateMutation.mutate({
                                  id: watchlistItem.id,
                                  rating: newRating,
                                });
                              }}
                              disabled={rateMutation.isPending}
                              aria-label="Like"
                            >
                              <motion.span
                                key={`like-${watchlistItem.rating === 1}`}
                                initial={!prefersReducedMotion && watchlistItem.rating === 1 ? { scale: 1.3 } : false}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                className="flex items-center justify-center"
                              >
                                <ThumbsUp
                                  className={cn(
                                    "h-4 w-4 transition-colors duration-200",
                                    watchlistItem.rating === 1 &&
                                      "fill-green-500 text-green-500",
                                  )}
                                />
                              </motion.span>
                            </Button>
                          </motion.div>
                          <motion.div whileTap={tapAnimation}>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                const newRating =
                                  watchlistItem.rating === -1 ? null : -1;
                                rateMutation.mutate({
                                  id: watchlistItem.id,
                                  rating: newRating,
                                });
                              }}
                              disabled={rateMutation.isPending}
                              aria-label="Dislike"
                            >
                              <motion.span
                                key={`dislike-${watchlistItem.rating === -1}`}
                                initial={!prefersReducedMotion && watchlistItem.rating === -1 ? { scale: 1.3 } : false}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                className="flex items-center justify-center"
                              >
                                <ThumbsDown
                                  className={cn(
                                    "h-4 w-4 transition-colors duration-200",
                                    watchlistItem.rating === -1 &&
                                      "fill-red-500 text-red-500",
                                  )}
                                />
                              </motion.span>
                            </Button>
                          </motion.div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                )}

                {/* Director (movie) or Created by / Network (TV) */}
                {isTV ? (
                  isDetailLoading && !creatorNames && !networkNames ? (
                    <Skeleton className="h-4 w-32" />
                  ) : creatorNames ? (
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">Created by:</span>{" "}
                      {creatorNames}
                    </p>
                  ) : networkNames ? (
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">Network:</span>{" "}
                      {networkNames}
                    </p>
                  ) : null
                ) : (
                  isDetailLoading && !director ? (
                    <Skeleton className="h-4 w-32" />
                  ) : director ? (
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">
                        Director:
                      </span>{" "}
                      {director.name}
                    </p>
                  ) : null
                )}

                {/* Cast */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Cast</h3>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                    {isDetailLoading && cast.length === 0
                      ? Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="shrink-0 w-16 space-y-2">
                            <Skeleton className="h-16 w-16 rounded-full" />
                            <Skeleton className="h-2 w-12 mx-auto" />
                          </div>
                        ))
                      : cast.map((person) => (
                          <div
                            key={person.id}
                            className="shrink-0 w-16 text-center"
                          >
                            <div className="relative h-16 w-16 rounded-full overflow-hidden bg-muted mx-auto">
                              {person.profile_path ? (
                                <Image
                                  src={`${TMDB_IMAGE_BASE}/w185${person.profile_path}`}
                                  alt={person.name}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-lg font-medium">
                                  {person.name[0]}
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] font-medium mt-1.5 line-clamp-1">
                              {person.name}
                            </p>
                            <p className="text-[9px] text-muted-foreground line-clamp-1">
                              {person.character}
                            </p>
                          </div>
                        ))}
                  </div>
                </div>

                {/* Watch Providers */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Where to Watch</h3>
                  {isDetailLoading && !watchProviders ? (
                    <div className="space-y-3">
                      <Skeleton className="h-8 w-48" />
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <Skeleton className="h-12 w-12 rounded-lg" />
                      </div>
                    </div>
                  ) : hasAnyProvider ? (
                    <Tabs defaultValue={defaultTab}>
                      <TabsList className="h-8">
                        {hasStream && (
                          <TabsTrigger
                            value="stream"
                            className="text-xs px-3 h-6"
                          >
                            Stream
                          </TabsTrigger>
                        )}
                        {hasRent && (
                          <TabsTrigger
                            value="rent"
                            className="text-xs px-3 h-6"
                          >
                            Rent
                          </TabsTrigger>
                        )}
                        {hasBuy && (
                          <TabsTrigger value="buy" className="text-xs px-3 h-6">
                            Buy
                          </TabsTrigger>
                        )}
                      </TabsList>
                      {hasStream && (
                        <TabsContent value="stream">
                          <ProviderGrid providers={watchProviders!.flatrate!} />
                        </TabsContent>
                      )}
                      {hasRent && (
                        <TabsContent value="rent">
                          <ProviderGrid providers={watchProviders!.rent!} />
                        </TabsContent>
                      )}
                      {hasBuy && (
                        <TabsContent value="buy">
                          <ProviderGrid providers={watchProviders!.buy!} />
                        </TabsContent>
                      )}
                    </Tabs>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Not available for streaming in your region
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground pt-1">
                    Streaming data powered by JustWatch
                  </p>
                </div>

                {/* Seasons — TV only */}
                {isTV && seasons.length > 0 && (
                  <SeasonsSection seasons={seasons} />
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
