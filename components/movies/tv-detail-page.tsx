"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  Bookmark,
  CircleCheck,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ExternalLink,
} from "lucide-react";
import type { TVDetailsWithExtras, TVSeason } from "@/types/tv";
import type { WatchProviderResult } from "@/types/movie";
import {
  useWatchlistCheck,
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useUpdateWatchlistStatus,
  useRateWatchlistItem,
} from "@/hooks/use-watchlist";
import { cn, getBackdropUrl } from "@/lib/utils";
import { TMDB_IMAGE_BASE, PROVIDER_URLS, TV_GENRES, GENRES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TVDetailPageContentProps {
  details: TVDetailsWithExtras;
  watchProviders: WatchProviderResult | null;
  country: string;
}

function getStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Returning Series":
      return "default";
    case "Ended":
      return "secondary";
    case "Canceled":
      return "destructive";
    case "In Production":
    case "Planned":
    case "Pilot":
      return "outline";
    default:
      return "secondary";
  }
}

function ProviderGrid({
  providers,
}: {
  providers: { logo_path: string; provider_name: string; provider_id: number }[];
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {providers.map((p) => {
        const url = PROVIDER_URLS[p.provider_id];
        const content = (
          <>
            <div className="relative h-12 w-12 overflow-hidden rounded-xl">
              <Image
                src={`${TMDB_IMAGE_BASE}/w92${p.logo_path}`}
                alt={p.provider_name}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <span className="text-[10px] text-muted-foreground text-center line-clamp-1 w-12">
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
          <div key={p.provider_id} className="flex flex-col items-center gap-1.5">
            {content}
          </div>
        );
      })}
    </div>
  );
}

function SeasonsSection({ seasons }: { seasons: TVSeason[] }) {
  const [showAll, setShowAll] = useState(false);

  // Filter out specials (season 0), sort latest first
  const regularSeasons = seasons
    .filter((s) => s.season_number > 0)
    .sort((a, b) => b.season_number - a.season_number);

  if (regularSeasons.length === 0) return null;

  const hasMany = regularSeasons.length > 5;
  const displayedSeasons = hasMany && !showAll ? regularSeasons.slice(0, 5) : regularSeasons;
  const latestSeasonNumber = regularSeasons[0]?.season_number;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
        Seasons ({regularSeasons.length})
      </h2>
      <div className="space-y-3">
        {displayedSeasons.map((season) => (
          <div key={season.id} className="flex items-center gap-3">
            <div className="relative h-16 w-11 overflow-hidden rounded-md bg-muted shrink-0">
              {season.poster_path ? (
                <Image
                  src={`${TMDB_IMAGE_BASE}/w92${season.poster_path}`}
                  alt={season.name}
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                  S{season.season_number}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{season.name}</p>
                {season.season_number === latestSeasonNumber && (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0">
                    Latest
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {season.episode_count} {season.episode_count === 1 ? "Episode" : "Episodes"}
                {season.air_date && ` | ${season.air_date.slice(0, 4)}`}
              </p>
            </div>
          </div>
        ))}
      </div>
      {hasMany && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Show less" : `Show all ${regularSeasons.length} seasons`}
        </Button>
      )}
    </div>
  );
}

export function TVDetailPageContent({
  details,
  watchProviders,
  country,
}: TVDetailPageContentProps) {
  const prefersReducedMotion = useReducedMotion();

  const year = details.first_air_date?.slice(0, 4) ?? "";
  const rating = details.vote_average?.toFixed(1) ?? "0.0";
  const creators = details.created_by ?? [];
  const creatorNames = creators.map((c) => c.name).join(", ");
  const cast = details.credits?.cast?.slice(0, 15) ?? [];

  const { data: watchlistItem, isLoading: isCheckingWatchlist } = useWatchlistCheck(
    details.id,
    "tv",
  );
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();
  const statusMutation = useUpdateWatchlistStatus();
  const rateMutation = useRateWatchlistItem();

  const isInLibrary = !!watchlistItem;
  const isWantToWatch = watchlistItem?.status === "want_to_watch";
  const isWatched = watchlistItem?.status === "watched";

  const tapAnimation = prefersReducedMotion ? {} : { scale: 0.85 };

  const handleAddToLibrary = () => {
    addMutation.mutate(
      {
        tmdbId: details.id,
        title: details.name,
        posterPath: details.poster_path,
        status: "want_to_watch",
        mediaType: "tv",
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
    if (isWantToWatch && watchlistItem) {
      statusMutation.mutate({ id: watchlistItem.id, status: "watched" });
    } else {
      addMutation.mutate(
        {
          tmdbId: details.id,
          title: details.name,
          posterPath: details.poster_path,
          status: "watched",
          mediaType: "tv",
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
    if (!watchlistItem) return;
    const previousStatus = watchlistItem.status;
    removeMutation.mutate(
      { id: watchlistItem.id, tmdbId: watchlistItem.tmdbId, mediaType: "tv" },
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
                    tmdbId: details.id,
                    title: details.name,
                    posterPath: details.poster_path,
                    status: previousStatus,
                    mediaType: "tv",
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

  // Genre IDs can include both TV-specific and shared genres
  const genres = details.genres ?? [];

  const hasStream = (watchProviders?.flatrate?.length ?? 0) > 0;
  const hasRent = (watchProviders?.rent?.length ?? 0) > 0;
  const hasBuy = (watchProviders?.buy?.length ?? 0) > 0;
  const hasAnyProvider = hasStream || hasRent || hasBuy;
  const defaultTab = hasStream ? "stream" : hasRent ? "rent" : "buy";

  const backdropVariants = {
    hidden: { scale: prefersReducedMotion ? 1 : 1.05, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay: 0.2, ease: "easeOut" as const },
    },
  };

  // Resolve genre names: TV-specific first, fallback to shared movie genres
  function resolveGenreName(genreId: number): string | undefined {
    return TV_GENRES[genreId] ?? GENRES[genreId];
  }

  return (
    <div className="min-h-screen pb-32 md:pb-24">
      {/* Full-bleed backdrop */}
      <motion.div
        className="relative w-full h-[50vh] min-h-[300px] overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={backdropVariants}
      >
        <Image
          src={getBackdropUrl(details.backdrop_path, "lg")}
          alt={details.name}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-background/30 to-transparent" />

        {/* Title overlay at bottom-left */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white line-clamp-2 drop-shadow-lg">
            {details.name}
          </h1>
          {details.tagline && (
            <p className="mt-2 text-sm md:text-base text-white/70 italic line-clamp-1">
              &ldquo;{details.tagline}&rdquo;
            </p>
          )}
        </div>
      </motion.div>

      {/* Main content */}
      <motion.div
        className="max-w-5xl mx-auto px-4 md:px-6 space-y-6 mt-6"
        initial="hidden"
        animate="visible"
        variants={contentVariants}
      >
        {/* Metadata pills row */}
        <div className="flex flex-wrap items-center gap-2">
          {year && (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {year}
            </Badge>
          )}
          {details.number_of_seasons > 0 && (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {details.number_of_seasons}{" "}
              {details.number_of_seasons === 1 ? "Season" : "Seasons"}
            </Badge>
          )}
          {details.number_of_episodes > 0 && (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {details.number_of_episodes} Episodes
            </Badge>
          )}
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {rating} ★
          </Badge>
          {country && (
            <Badge variant="outline" className="text-sm px-3 py-1">
              {country}
            </Badge>
          )}
          {details.status && (
            <Badge
              variant={getStatusBadgeVariant(details.status)}
              className="text-sm px-3 py-1"
            >
              {details.status}
            </Badge>
          )}
        </div>

        {/* Genre tags */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => {
              const name = resolveGenreName(g.id) ?? g.name;
              return (
                <Badge key={g.id} variant="outline" className="text-xs px-2.5 py-1">
                  {name}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Overview */}
        {details.overview && (
          <p className="text-base leading-relaxed text-muted-foreground max-w-3xl">
            {details.overview}
          </p>
        )}

        {/* Created by */}
        {creatorNames && (
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">Created by:</span>{" "}
            {creatorNames}
          </p>
        )}

        {/* Cast chips */}
        {cast.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Cast
            </h2>
            <div className="flex flex-wrap gap-2">
              {cast.map((person) => (
                <Badge
                  key={person.id}
                  variant="secondary"
                  className="text-xs px-2.5 py-1 font-normal"
                >
                  {person.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Watch Providers */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Where to Watch
          </h2>
          {hasAnyProvider ? (
            <Tabs defaultValue={defaultTab}>
              <TabsList className="h-9">
                {hasStream && (
                  <TabsTrigger value="stream" className="text-xs px-4">
                    Stream
                  </TabsTrigger>
                )}
                {hasRent && (
                  <TabsTrigger value="rent" className="text-xs px-4">
                    Rent
                  </TabsTrigger>
                )}
                {hasBuy && (
                  <TabsTrigger value="buy" className="text-xs px-4">
                    Buy
                  </TabsTrigger>
                )}
              </TabsList>
              {hasStream && (
                <TabsContent value="stream" className="mt-3">
                  <ProviderGrid providers={watchProviders!.flatrate!} />
                </TabsContent>
              )}
              {hasRent && (
                <TabsContent value="rent" className="mt-3">
                  <ProviderGrid providers={watchProviders!.rent!} />
                </TabsContent>
              )}
              {hasBuy && (
                <TabsContent value="buy" className="mt-3">
                  <ProviderGrid providers={watchProviders!.buy!} />
                </TabsContent>
              )}
            </Tabs>
          ) : (
            <p className="text-sm text-muted-foreground">
              Not available for streaming in your region
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">
            Streaming data powered by JustWatch
          </p>
        </div>

        {/* Seasons breakdown */}
        {details.seasons && details.seasons.length > 0 && (
          <SeasonsSection seasons={details.seasons} />
        )}

      </motion.div>

      {/* Fixed bottom action bar */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-[60px] z-40 bg-background/90 backdrop-blur-md border-t border-border/50 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-2 flex-wrap">
          {isCheckingWatchlist ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <>
              {/* Add to Library / In Library */}
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
                  onClick={isWatched ? handleMoveToWantToWatch : handleAddToLibrary}
                  disabled={addMutation.isPending || statusMutation.isPending}
                >
                  {addMutation.isPending || statusMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                  {isWatched ? "Want to Watch" : "Add to Library"}
                </Button>
              )}

              {/* Mark as Watched */}
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
                  disabled={addMutation.isPending || statusMutation.isPending}
                >
                  {statusMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CircleCheck className="h-4 w-4" />
                  )}
                  Mark Watched
                </Button>
              )}

              {/* Like / Dislike — only when in library */}
              {isInLibrary && watchlistItem && (
                <>
                  <motion.div whileTap={tapAnimation}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newRating = watchlistItem.rating === 1 ? null : 1;
                        rateMutation.mutate({ id: watchlistItem.id, rating: newRating });
                      }}
                      disabled={rateMutation.isPending}
                      aria-label="Like"
                      className={cn(
                        "transition-colors duration-200",
                        watchlistItem.rating === 1 && "text-green-500",
                      )}
                    >
                      <ThumbsUp
                        className={cn(
                          "h-4 w-4",
                          watchlistItem.rating === 1 && "fill-green-500",
                        )}
                      />
                    </Button>
                  </motion.div>
                  <motion.div whileTap={tapAnimation}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newRating = watchlistItem.rating === -1 ? null : -1;
                        rateMutation.mutate({ id: watchlistItem.id, rating: newRating });
                      }}
                      disabled={rateMutation.isPending}
                      aria-label="Dislike"
                      className={cn(
                        "transition-colors duration-200",
                        watchlistItem.rating === -1 && "text-red-500",
                      )}
                    >
                      <ThumbsDown
                        className={cn(
                          "h-4 w-4",
                          watchlistItem.rating === -1 && "fill-red-500",
                        )}
                      />
                    </Button>
                  </motion.div>
                </>
              )}

              {/* Trailer button */}
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 ml-auto"
                asChild
              >
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(details.name + " official trailer")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  Trailer
                </a>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
