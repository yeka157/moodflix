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
  WatchlistStats,
} from "@/types/watchlist";
import type { MediaType } from "@/types/media";

function serializeItem(row: typeof watchlist.$inferSelect): WatchlistItem {
  return {
    id: row.id,
    userId: row.userId,
    tmdbId: row.tmdbId,
    title: row.title,
    posterPath: row.posterPath,
    status: row.status ?? ("want_to_watch" as WatchlistStatus),
    rating: row.rating,
    mediaType: row.mediaType as MediaType,
    addedAt: row.addedAt?.toISOString() ?? new Date().toISOString(),
    watchedAt: row.watchedAt?.toISOString() ?? null,
  };
}

export async function getWatchlist(
  userId: string,
  status?: WatchlistStatus,
): Promise<WatchlistItem[]> {
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

export async function getWatchlistStats(
  userId: string,
): Promise<WatchlistStats> {
  const rows = await db
    .select({
      status: watchlist.status,
      watchedAt: watchlist.watchedAt,
    })
    .from(watchlist)
    .where(eq(watchlist.userId, userId));

  const currentYear = new Date().getFullYear();
  let inLibrary = 0;
  let watched = 0;
  let thisYear = 0;
  for (const r of rows) {
    if (r.status === "watched") {
      watched++;
      if (r.watchedAt && r.watchedAt.getFullYear() === currentYear) {
        thisYear++;
      }
    } else {
      inLibrary++;
    }
  }
  return { inLibrary, watched, thisYear };
}

export async function getWatchlistTmdbIds(
  userId: string,
): Promise<WatchlistTmdbEntry[]> {
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
    status: r.status ?? ("want_to_watch" as WatchlistStatus),
    mediaType: r.mediaType as MediaType,
  }));
}

export async function getWatchlistItemByTmdbId(
  userId: string,
  tmdbId: number,
  mediaType: MediaType = "movie",
): Promise<WatchlistItem | null> {
  const rows = await db
    .select()
    .from(watchlist)
    .where(
      and(
        eq(watchlist.userId, userId),
        eq(watchlist.tmdbId, tmdbId),
        eq(watchlist.mediaType, mediaType),
      ),
    )
    .limit(1);

  return rows.length > 0 ? serializeItem(rows[0]) : null;
}

export async function addToWatchlist(
  userId: string,
  data: AddToWatchlistInput,
): Promise<WatchlistActionResult> {
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

    return { item: serializeItem(rows[0]) };
  } catch (err: unknown) {
    if (isUniqueConstraintViolation(err, "watchlist_user_tmdb_media_unique")) {
      return { error: "Already in library" };
    }
    return { error: "Failed to add to library" };
  }
}

function isUniqueConstraintViolation(
  err: unknown,
  constraintName: string,
): boolean {
  if (!(err instanceof Error)) return false;
  if (err.message.includes(constraintName)) return true;
  const cause = err.cause;
  return cause instanceof Error && cause.message.includes(constraintName);
}

export async function removeFromWatchlist(
  userId: string,
  watchlistItemId: string,
): Promise<WatchlistDeleteResult> {
  try {
    await db
      .delete(watchlist)
      .where(
        and(eq(watchlist.id, watchlistItemId), eq(watchlist.userId, userId)),
      );

    return { success: true };
  } catch {
    return { error: "Failed to remove from library" };
  }
}

export async function updateWatchlistStatus(
  userId: string,
  id: string,
  status: WatchlistStatus,
): Promise<WatchlistActionResult> {
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

    return { item: serializeItem(rows[0]) };
  } catch {
    return { error: "Failed to update status" };
  }
}

export async function rateWatchlistItem(
  userId: string,
  id: string,
  rating: 1 | -1 | null,
): Promise<WatchlistActionResult> {
  try {
    const rows = await db
      .update(watchlist)
      .set({ rating })
      .where(and(eq(watchlist.id, id), eq(watchlist.userId, userId)))
      .returning();

    if (rows.length === 0) return { error: "Item not found" };

    return { item: serializeItem(rows[0]) };
  } catch {
    return { error: "Failed to update rating" };
  }
}
