"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  ArrowLeft,
  Play,
  Plus,
  Bookmark,
  Share2,
  Star,
  CircleCheck,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ExternalLink,
  Film,
  Clock,
  Globe,
} from "lucide-react";
import type {
  MovieDetailsWithExtras,
  Movie,
  WatchProviderResult,
} from "@/types/movie";
import { getMovieAvailabilityStatus } from "@/lib/availability";
import {
  useWatchlistCheck,
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useUpdateWatchlistStatus,
  useRateWatchlistItem,
} from "@/hooks/use-watchlist";
import {
  cn,
  getBackdropUrl,
  getPosterUrl,
} from "@/lib/utils";
import { TMDB_IMAGE_BASE, PROVIDER_URLS } from "@/lib/constants";
import { MovieRow } from "@/components/movies/movie-row";
import { BellNotifyButton } from "@/components/movies/bell-notify-button";

interface MovieDetailPageContentProps {
  details: MovieDetailsWithExtras;
  watchProviders: WatchProviderResult | null;
  recommendations: Movie[];
  country: string;
}

type StreamRow = {
  id: number;
  name: string;
  logoPath: string | null;
  type: "Stream" | "Rent" | "Buy";
};

function formatRuntime(minutes: number | null): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function flattenProviders(wp: WatchProviderResult | null): StreamRow[] {
  if (!wp) return [];
  const out: StreamRow[] = [];
  const seen = new Set<number>();
  const push = (
    arr: typeof wp.flatrate,
    type: StreamRow["type"],
  ) => {
    arr?.forEach((p) => {
      if (seen.has(p.provider_id)) return;
      seen.add(p.provider_id);
      out.push({
        id: p.provider_id,
        name: p.provider_name,
        logoPath: p.logo_path,
        type,
      });
    });
  };
  push(wp.flatrate, "Stream");
  push(wp.rent, "Rent");
  push(wp.buy, "Buy");
  return out;
}

const TABS = ["overview", "cast", "streams", "related"] as const;
type Tab = (typeof TABS)[number];

export function MovieDetailPageContent({
  details,
  watchProviders,
  recommendations,
  country,
}: MovieDetailPageContentProps) {
  const backRef = useRef<HTMLImageElement | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = backRef.current;
        if (!el) return;
        const y = Math.min(window.scrollY, 600);
        el.style.transform = `translateY(${y * 0.4}px) scale(${1 + y * 0.0005})`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const year = details.release_date?.slice(0, 4) ?? "—";
  const runtime = formatRuntime(details.runtime);
  const rating = details.vote_average?.toFixed(1) ?? "—";
  const director = details.credits?.crew?.find((c) => c.job === "Director");
  const cast = details.credits?.cast?.slice(0, 12) ?? [];
  const genres = details.genres ?? [];

  const isUpcoming = details.release_date
    ? new Date(details.release_date) > new Date()
    : false;

  const streams = flattenProviders(watchProviders);
  const availability = getMovieAvailabilityStatus({
    watchProviders,
    releaseDates: details.release_dates?.results,
    country,
    releaseDate: details.release_date,
  });

  const { data: watchlistItem, isLoading: isCheckingWatchlist } =
    useWatchlistCheck(details.id, "movie");
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();
  const statusMutation = useUpdateWatchlistStatus();
  const rateMutation = useRateWatchlistItem();

  const isInLibrary = !!watchlistItem;
  const isWantToWatch = watchlistItem?.status === "want_to_watch";
  const isWatched = watchlistItem?.status === "watched";

  const handleAddToLibrary = () => {
    addMutation.mutate(
      {
        tmdbId: details.id,
        title: details.title,
        posterPath: details.poster_path,
        status: "want_to_watch",
        mediaType: "movie",
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
          title: details.title,
          posterPath: details.poster_path,
          status: "watched",
          mediaType: "movie",
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
      { id: watchlistItem.id, tmdbId: watchlistItem.tmdbId, mediaType: "movie" },
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
                    title: details.title,
                    posterPath: details.poster_path,
                    status: previousStatus,
                    mediaType: "movie",
                  }),
              },
              duration: 5000,
            });
          }
        },
      },
    );
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: details.title, url });
      } catch {
        /* ignore */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      } catch {
        toast.error("Could not copy link");
      }
    }
  };

  const trailerUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    details.title + " official trailer",
  )}`;

  const scrollTo = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="page detail">
      <div className="detail-back">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={backRef}
          src={getBackdropUrl(details.backdrop_path, "lg")}
          alt=""
        />
      </div>

      <div className="detail-content">
        <Link href="/discover" className="detail-back-btn">
          <ArrowLeft size={14} />
          Back to discovery
        </Link>

        <div className="detail-hero">
          <div className="detail-poster fade-up">
            <Image
              src={getPosterUrl(details.poster_path)}
              alt={details.title}
              fill
              priority
              sizes="320px"
            />
          </div>

          <div className="detail-info fade-up" style={{ animationDelay: "0.1s" }}>
            {genres.length > 0 && (
              <div className="detail-genres">
                {genres.map((g) => (
                  <span key={g.id} className="g">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            <h1 className="detail-title">{details.title}</h1>

            {details.tagline && (
              <p className="detail-tagline">&ldquo;{details.tagline}&rdquo;</p>
            )}

            <div className="detail-meta">
              <div className="item">
                <div className="label">Rating</div>
                <div className="val">
                  <Star className="size-4 text-[var(--amber)]" fill="currentColor" />
                  {rating}
                  <span className="small">/ 10</span>
                </div>
              </div>
              <div className="item">
                <div className="label">Runtime</div>
                <div className="val tnum">{runtime}</div>
              </div>
              <div className="item">
                <div className="label">Released</div>
                <div className="val tnum">{year}</div>
              </div>
              {director && (
                <div className="item">
                  <div className="label">Director</div>
                  <div className="val text-base">{director.name}</div>
                </div>
              )}
            </div>

            {details.overview && (
              <p className="detail-desc">{details.overview}</p>
            )}

            <div className="detail-actions">
              <a
                href={trailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-red btn-lg"
              >
                <Play size={14} fill="currentColor" />
                Watch trailer
              </a>
              {isCheckingWatchlist ? (
                <button className="btn btn-ghost" disabled>
                  <Loader2 size={14} className="animate-spin" />
                  Loading
                </button>
              ) : isInLibrary ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleRemove}
                  disabled={removeMutation.isPending}
                >
                  {removeMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Bookmark size={14} fill="currentColor" />
                  )}
                  In library
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleAddToLibrary}
                  disabled={addMutation.isPending}
                >
                  {addMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  Add to library
                </button>
              )}
              <button
                type="button"
                className="btn btn-outline"
                onClick={isWatched ? handleRemove : handleMarkWatched}
                disabled={statusMutation.isPending || addMutation.isPending}
              >
                <CircleCheck size={14} fill={isWatched ? "currentColor" : "none"} />
                {isWatched ? "Watched" : "Mark watched"}
              </button>
              <button type="button" className="btn btn-outline" onClick={handleShare}>
                <Share2 size={14} />
                Share
              </button>
              {isUpcoming && (
                <BellNotifyButton
                  tmdbId={details.id}
                  title={details.title}
                  posterPath={details.poster_path}
                  releaseDate={details.release_date ?? null}
                />
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="detail-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={cn("detail-tab", tab === t && "active")}
              onClick={() => {
                setTab(t);
                scrollTo(`detail-${t}`);
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="detail-sections">
          <div>
            <section id="detail-overview" className="detail-section reveal mb-12">
              <h3>About the film</h3>
              <p className="text-base leading-[1.65] text-[var(--ink-2)] m-0">
                {details.overview}
              </p>
            </section>

            <section id="detail-cast" className="detail-section reveal mb-12">
              <h3>Cast</h3>
              {cast.length > 0 ? (
                <div className="cast-row">
                  {cast.map((person) => (
                    <div key={person.id} className="cast-card">
                      <div className="av">
                        {person.profile_path ? (
                          <Image
                            src={`${TMDB_IMAGE_BASE}/w185${person.profile_path}`}
                            alt={person.name}
                            fill
                            sizes="110px"
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center font-display text-[32px] text-muted-foreground">
                            {person.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="name">{person.name}</div>
                      <div className="role">{person.character ?? ""}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--ink-3)] text-[13px] m-0">
                  No cast listed
                </p>
              )}
            </section>

            {recommendations.length > 0 && (
              <section id="detail-related" className="detail-section reveal">
                <MovieRow
                  eyebrowId="MORE LIKE THIS"
                  title={
                    <>
                      If you liked <span className="it">this</span>
                    </>
                  }
                  movies={recommendations}
                  readOnly
                />
              </section>
            )}
          </div>

          <aside
            id="detail-streams"
            className="sticky top-24 h-fit self-start flex flex-col gap-4"
          >
            <div className="streams">
              <div className="head">
                <h4>Where to watch</h4>
                {streams.length > 0 && (
                  <span className="mono text-[11px] text-[var(--emerald)]">
                    ● {streams.length} available
                  </span>
                )}
              </div>
              {streams.length > 0 ? (
                streams.map((s) => {
                  const href = PROVIDER_URLS[s.id];
                  const inner = (
                    <>
                      <div className="left">
                        <div className="logo">
                          {s.logoPath ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`${TMDB_IMAGE_BASE}/w92${s.logoPath}`}
                              alt={s.name}
                            />
                          ) : (
                            s.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="name">{s.name}</div>
                          <div className="type">{s.type}</div>
                        </div>
                      </div>
                      <div className="price">
                        {s.type === "Stream" ? "—" : ""}
                      </div>
                    </>
                  );
                  return href ? (
                    <a
                      key={s.id}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="stream-row"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div key={s.id} className="stream-row">
                      {inner}
                    </div>
                  );
                })
              ) : (
                <div className="text-[13px] text-[var(--ink-3)] pt-2 pb-1">
                  {availability.type === "in_theaters" && (
                    <>
                      <Film className="inline size-4 mr-1.5 align-text-bottom" />
                      In theaters now — not yet streaming
                    </>
                  )}
                  {availability.type === "not_yet_streaming" && (
                    <>
                      <Clock className="inline size-4 mr-1.5 align-text-bottom" />
                      Not yet on streaming
                    </>
                  )}
                  {(availability.type === "not_in_region" ||
                    availability.type === "available") && (
                    <>
                      <Globe className="inline size-4 mr-1.5 align-text-bottom" />
                      Not available in your region
                    </>
                  )}
                </div>
              )}
              <p className="mono text-[10px] text-[var(--ink-3)] mt-3 mb-0 tracking-[0.1em] uppercase">
                Data via JustWatch
              </p>
            </div>

            <div className="streams">
              <div className="head">
                <h4>Your status</h4>
              </div>
              <div className="py-3.5 flex gap-2">
                <button
                  type="button"
                  className={cn("btn flex-1 justify-center", isWatched ? "btn-red" : "btn-ghost")}
                  onClick={isWatched ? handleRemove : handleMarkWatched}
                  disabled={statusMutation.isPending || addMutation.isPending}
                >
                  <CircleCheck size={14} fill={isWatched ? "currentColor" : "none"} />
                  Watched
                </button>
                <button
                  type="button"
                  className={cn("btn flex-1 justify-center", isWantToWatch ? "btn-red" : "btn-ghost")}
                  onClick={isWantToWatch ? handleRemove : handleAddToLibrary}
                  disabled={addMutation.isPending}
                >
                  <Plus size={14} />
                  Want
                </button>
              </div>
              {isInLibrary && watchlistItem && (
                <div className="pt-4 border-t border-border">
                  <div className="eyebrow mb-3">Your rating</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={cn(
                        "btn flex-1 justify-center",
                        watchlistItem.rating === 1 ? "btn-red" : "btn-outline",
                      )}
                      onClick={() => {
                        const newRating = watchlistItem.rating === 1 ? null : 1;
                        rateMutation.mutate({
                          id: watchlistItem.id,
                          rating: newRating,
                        });
                      }}
                      disabled={rateMutation.isPending}
                      aria-label="Like"
                    >
                      <ThumbsUp
                        size={14}
                        fill={watchlistItem.rating === 1 ? "currentColor" : "none"}
                      />
                      Liked
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "btn flex-1 justify-center",
                        watchlistItem.rating === -1
                          ? "btn-red"
                          : "btn-outline",
                      )}
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
                        size={14}
                        fill={
                          watchlistItem.rating === -1 ? "currentColor" : "none"
                        }
                      />
                      Disliked
                    </button>
                  </div>
                </div>
              )}
            </div>

            <a
              href={trailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline w-full justify-center"
            >
              <ExternalLink size={14} />
              Find trailer on YouTube
            </a>
          </aside>
        </div>
      </div>
    </div>
  );
}
