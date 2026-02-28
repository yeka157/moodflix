"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/drizzle";
import { watchlist } from "@/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import type {
  AddToWatchlistInput,
  WatchlistItem,
  WatchlistStatus,
  WatchlistActionResult,
  WatchlistDeleteResult,
  WatchlistTmdbEntry,
} from "@/types/watchlist";
import type { MediaType } from "@/types/media";

function serializeItem(
  row: typeof watchlist.$inferSelect,
): WatchlistItem {
  return {
    id: row.id,
    userId: row.userId,
    tmdbId: row.tmdbId,
    title: row.title,
    posterPath: row.posterPath,
    status: row.status ?? "want_to_watch" as WatchlistStatus,
    rating: row.rating,
    mediaType: row.mediaType as MediaType,
    addedAt: row.addedAt?.toISOString() ?? new Date().toISOString(),
    watchedAt: row.watchedAt?.toISOString() ?? null,
  };
}

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

  const conditions = status
    ? and(eq(watchlist.userId, userId), eq(watchlist.status, status))
    : eq(watchlist.userId, userId);

  const rows = await db
    .select()
    .from(watchlist)
    .where(conditions)
    .orderBy(desc(watchlist.addedAt));

  return rows.map(serializeItem);
}

export async function getWatchlistTmdbIds(): Promise<WatchlistTmdbEntry[]> {
  const userId = await getAuthUserId();
  if (!userId) return [];

  const rows = await db
    .select({
      id: watchlist.id,
      tmdbId: watchlist.tmdbId,
      status: watchlist.status,
      mediaType: watchlist.mediaType,
    })
    .from(watchlist)
    .where(eq(watchlist.userId, userId));

  return rows.map((r) => ({
    id: r.id,
    tmdbId: r.tmdbId,
    status: r.status ?? "want_to_watch" as WatchlistStatus,
    mediaType: r.mediaType as MediaType,
  }));
}

export async function getWatchlistItemByTmdbId(
  tmdbId: number,
): Promise<WatchlistItem | null> {
  const userId = await getAuthUserId();
  if (!userId) return null;

  const rows = await db
    .select()
    .from(watchlist)
    .where(and(eq(watchlist.userId, userId), eq(watchlist.tmdbId, tmdbId)))
    .limit(1);

  return rows.length > 0 ? serializeItem(rows[0]) : null;
}

export async function addToWatchlist(
  data: AddToWatchlistInput,
): Promise<WatchlistActionResult> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };

  try {
    const rows = await db
      .insert(watchlist)
      .values({
        userId,
        tmdbId: data.tmdbId,
        title: data.title,
        posterPath: data.posterPath,
        status: data.status ?? "want_to_watch",
        mediaType: data.mediaType ?? "movie",
      })
      .returning();

    revalidatePath("/library");
    return { item: serializeItem(rows[0]) };
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message.includes("watchlist_user_tmdb_media_unique")
    ) {
      return { error: "Already in library" };
    }
    return { error: "Failed to add to library" };
  }
}

export async function removeFromWatchlist(
  watchlistItemId: string,
): Promise<WatchlistDeleteResult> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };

  try {
    await db
      .delete(watchlist)
      .where(
        and(eq(watchlist.id, watchlistItemId), eq(watchlist.userId, userId)),
      );

    revalidatePath("/library");
    return { success: true };
  } catch {
    return { error: "Failed to remove from library" };
  }
}

export async function updateWatchlistStatus(
  id: string,
  status: WatchlistStatus,
): Promise<WatchlistActionResult> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };

  try {
    const updateData: Record<string, unknown> = { status };
    if (status === "watched") {
      updateData.watchedAt = new Date();
    } else {
      updateData.watchedAt = null;
    }

    const rows = await db
      .update(watchlist)
      .set(updateData)
      .where(and(eq(watchlist.id, id), eq(watchlist.userId, userId)))
      .returning();

    if (rows.length === 0) return { error: "Item not found" };

    revalidatePath("/library");
    return { item: serializeItem(rows[0]) };
  } catch {
    return { error: "Failed to update status" };
  }
}

export async function rateWatchlistItem(
  id: string,
  rating: 1 | -1 | null,
): Promise<WatchlistActionResult> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated" };

  try {
    const rows = await db
      .update(watchlist)
      .set({ rating })
      .where(and(eq(watchlist.id, id), eq(watchlist.userId, userId)))
      .returning();

    if (rows.length === 0) return { error: "Item not found" };

    revalidatePath("/library");
    return { item: serializeItem(rows[0]) };
  } catch {
    return { error: "Failed to update rating" };
  }
}
