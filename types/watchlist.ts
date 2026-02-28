import type { MediaType } from "@/types/media";

export type { MediaType };

export type WatchlistStatus = "want_to_watch" | "watched";

export type WatchlistFilterStatus = WatchlistStatus | "all";

export type WatchlistItem = {
  id: string;
  userId: string;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  status: WatchlistStatus;
  rating: number | null;
  mediaType: MediaType;
  addedAt: string;
  watchedAt: string | null;
};

export type WatchlistTmdbEntry = {
  id: string;
  tmdbId: number;
  status: WatchlistStatus;
  mediaType: MediaType;
};

export type AddToWatchlistInput = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  status?: WatchlistStatus;
  mediaType?: MediaType;
};

export type WatchlistActionResult =
  | { item: WatchlistItem; error?: never }
  | { item?: never; error: string };

export type WatchlistDeleteResult =
  | { success: true; error?: never }
  | { success?: never; error: string };
