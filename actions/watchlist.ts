"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import * as watchlistService from "@/lib/services/watchlist";
import type {
  AddToWatchlistInput,
  WatchlistItem,
  WatchlistStatus,
  WatchlistActionResult,
  WatchlistDeleteResult,
  WatchlistTmdbEntry,
  WatchlistStats,
} from "@/types/watchlist";
import type { MediaType } from "@/types/media";

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getWatchlist(
  status?: WatchlistStatus,
): Promise<WatchlistItem[]> {
  const userId = await getAuthUserId();
  if (!userId) return [];
  return watchlistService.getWatchlist(userId, status);
}

export async function getWatchlistStats(): Promise<WatchlistStats> {
  const userId = await getAuthUserId();
  if (!userId) return { inLibrary: 0, watched: 0, thisYear: 0 };
  return watchlistService.getWatchlistStats(userId);
}

export async function getWatchlistTmdbIds(): Promise<WatchlistTmdbEntry[]> {
  const userId = await getAuthUserId();
  if (!userId) return [];
  return watchlistService.getWatchlistTmdbIds(userId);
}

export async function getWatchlistItemByTmdbId(
  tmdbId: number,
  mediaType: MediaType = "movie",
): Promise<WatchlistItem | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;
  return watchlistService.getWatchlistItemByTmdbId(userId, tmdbId, mediaType);
}

export async function addToWatchlist(
  data: AddToWatchlistInput,
): Promise<WatchlistActionResult> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };
  const result = await watchlistService.addToWatchlist(userId, data);
  if (result.item) revalidatePath("/library");
  return result;
}

export async function removeFromWatchlist(
  watchlistItemId: string,
): Promise<WatchlistDeleteResult> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };
  const result = await watchlistService.removeFromWatchlist(
    userId,
    watchlistItemId,
  );
  if (result.success) revalidatePath("/library");
  return result;
}

export async function updateWatchlistStatus(
  id: string,
  status: WatchlistStatus,
): Promise<WatchlistActionResult> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };
  const result = await watchlistService.updateWatchlistStatus(
    userId,
    id,
    status,
  );
  if (result.item) revalidatePath("/library");
  return result;
}

export async function rateWatchlistItem(
  id: string,
  rating: 1 | -1 | null,
): Promise<WatchlistActionResult> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };
  const result = await watchlistService.rateWatchlistItem(userId, id, rating);
  if (result.item) revalidatePath("/library");
  return result;
}
