"use client";

import Image from "next/image";
import {
  Star,
  Clock,
  X,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { Movie } from "@/types/movie";
import type { WatchlistStatus } from "@/types/watchlist";
import { useMovieDetails } from "@/hooks/use-movies";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MovieDetailModalProps {
  movie: Movie | null;
  onClose: () => void;
}

function formatRuntime(minutes: number | null): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
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

const STATUS_LABELS: Record<WatchlistStatus, string> = {
  want_to_watch: "Want to Watch",
  watched: "Watched",
};

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

export function MovieDetailModal({ movie, onClose }: MovieDetailModalProps) {
  const { data: details, isLoading } = useMovieDetails(movie?.id ?? null);

  const year = movie?.release_date?.slice(0, 4) || "N/A";
  const rating =
    details?.vote_average?.toFixed(1) ??
    movie?.vote_average?.toFixed(1) ??
    "0.0";
  const runtime = details ? formatRuntime(details.runtime) : "";
  const director = details?.credits?.crew?.find((c) => c.job === "Director");
  const cast = details?.credits?.cast?.slice(0, 8) ?? [];
  const genres = details?.genres ?? [];
  const watchProviders = details?.watchProviders;
  const hasStream = (watchProviders?.flatrate?.length ?? 0) > 0;
  const hasRent = (watchProviders?.rent?.length ?? 0) > 0;
  const hasBuy = (watchProviders?.buy?.length ?? 0) > 0;
  const hasAnyProvider = hasStream || hasRent || hasBuy;
  const defaultTab = hasStream ? "stream" : hasRent ? "rent" : "buy";

  const { data: watchlistItem, isLoading: isCheckingWatchlist } =
    useWatchlistCheck(movie?.id ?? 0);
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();
  const statusMutation = useUpdateWatchlistStatus();
  const rateMutation = useRateWatchlistItem();
  const isInWatchlist = !!watchlistItem;

  return (
    <Dialog open={movie !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[calc(100%-1rem)] sm:max-w-[90vw] md:max-w-2xl p-0 gap-0 overflow-hidden border-border/50 bg-background"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          {movie?.title ?? "Movie Details"}
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
          {isLoading || !movie ? (
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
                />
                <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" />

                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">
                    {movie.title}
                  </h2>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 pb-6 space-y-5">
                {/* Meta row */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                  <span className="text-foreground font-medium">{year}</span>
                  {runtime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {runtime}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    {rating}
                  </span>
                  {details?.watchCountry && (
                    <Badge variant="outline" className="text-xs">
                      {details.watchCountry}
                    </Badge>
                  )}
                </div>

                {/* Tagline */}
                {details?.tagline && (
                  <p className="text-sm italic text-muted-foreground">
                    &ldquo;{details.tagline}&rdquo;
                  </p>
                )}

                {/* Overview */}
                <p className="text-sm leading-relaxed">
                  {details?.overview || movie.overview}
                </p>

                {/* Genres */}
                {genres.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {genres.map((g) => (
                      <Badge key={g.id} variant="secondary" className="text-xs">
                        {g.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Watchlist Actions */}
                <div className="flex items-center gap-3 flex-wrap">
                  {isCheckingWatchlist ? (
                    <Skeleton className="h-9 w-40" />
                  ) : isInWatchlist ? (
                    <>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            disabled={statusMutation.isPending}
                          >
                            <Bookmark className="h-4 w-4 fill-current" />
                            {STATUS_LABELS[watchlistItem.status]}
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuRadioGroup
                            value={watchlistItem.status}
                            onValueChange={(value) => {
                              const newStatus = value as WatchlistStatus;
                              if (newStatus === watchlistItem.status) return;
                              statusMutation.mutate(
                                { id: watchlistItem.id, status: newStatus },
                                {
                                  onSuccess: (result) => {
                                    if (result.error) toast.error(result.error);
                                    else
                                      toast.success(
                                        `Status updated to "${STATUS_LABELS[newStatus]}"`,
                                      );
                                  },
                                },
                              );
                            }}
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
                            onClick={() => {
                              removeMutation.mutate(
                                {
                                  id: watchlistItem.id,
                                  tmdbId: watchlistItem.tmdbId,
                                },
                                {
                                  onSuccess: (result) => {
                                    if (result.error) toast.error(result.error);
                                    else toast.success("Removed from watchlist");
                                  },
                                },
                              );
                            }}
                            disabled={removeMutation.isPending}
                          >
                            Remove from Watchlist
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <div className="flex items-center gap-1">
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
                          <ThumbsUp
                            className={cn(
                              "h-4 w-4",
                              watchlistItem.rating === 1 &&
                                "fill-green-500 text-green-500",
                            )}
                          />
                        </Button>
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
                          <ThumbsDown
                            className={cn(
                              "h-4 w-4",
                              watchlistItem.rating === -1 &&
                                "fill-red-500 text-red-500",
                            )}
                          />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        if (!movie) return;
                        addMutation.mutate(
                          {
                            tmdbId: movie.id,
                            title: movie.title,
                            posterPath: movie.poster_path,
                          },
                          {
                            onSuccess: (result) => {
                              if (result.error) toast.error(result.error);
                              else
                                toast.success(
                                  `Added "${movie.title}" to watchlist`,
                                );
                            },
                            onError: () =>
                              toast.error("Failed to add to watchlist"),
                          },
                        );
                      }}
                      disabled={addMutation.isPending}
                    >
                      {addMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                      Add to Watchlist
                    </Button>
                  )}
                </div>

                {/* Director */}
                {director && (
                  <p className="text-sm text-muted-foreground">
                    <span className="text-foreground font-medium">
                      Director:
                    </span>{" "}
                    {director.name}
                  </p>
                )}

                {/* Cast */}
                {cast.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Cast</h3>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                      {cast.map((person) => (
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
                )}

                {/* Watch Providers */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Where to Watch</h3>
                  {hasAnyProvider ? (
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
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
