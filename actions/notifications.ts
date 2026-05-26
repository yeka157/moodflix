"use server";

import { and, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/drizzle";
import { notifications } from "@/drizzle/schema";
import { createClient } from "@/lib/supabase/server";
import type {
  Notification,
  NotificationListPage,
  NotificationType,
} from "@/types/notification";

const PAGE_SIZE = 20;
type MediaTypeNullable = "movie" | "tv" | null;

function mapRow(row: typeof notifications.$inferSelect): Notification {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    posterPath: row.posterPath,
    href: row.href,
    tmdbId: row.tmdbId,
    mediaType: row.mediaType as MediaTypeNullable,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user.id;
}

export async function listNotifications(opts?: {
  cursor?: string | null;
  limit?: number;
}): Promise<NotificationListPage> {
  const userId = await requireUserId();
  const limit = Math.min(opts?.limit ?? PAGE_SIZE, 50);

  const cursorDate = opts?.cursor ? new Date(opts.cursor) : null;

  const rows = await db
    .select()
    .from(notifications)
    .where(
      cursorDate
        ? and(
            eq(notifications.userId, userId),
            lt(notifications.createdAt, cursorDate),
          )
        : eq(notifications.userId, userId),
    )
    .orderBy(desc(notifications.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = (hasMore ? rows.slice(0, limit) : rows).map(mapRow);
  const nextCursor =
    hasMore && items.length > 0 ? items[items.length - 1].createdAt : null;

  return { items, nextCursor };
}

export async function getUnreadCount(): Promise<number> {
  const userId = await requireUserId();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), isNull(notifications.readAt)),
    );
  return row?.count ?? 0;
}

export async function markAsRead(notificationId: string): Promise<void> {
  const userId = await requireUserId();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId),
        isNull(notifications.readAt),
      ),
    );
  revalidatePath("/notifications");
}

export async function markAllAsRead(): Promise<void> {
  const userId = await requireUserId();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(eq(notifications.userId, userId), isNull(notifications.readAt)),
    );
  revalidatePath("/notifications");
}

export async function markVisibleAsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const userId = await requireUserId();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        inArray(notifications.id, ids),
        isNull(notifications.readAt),
      ),
    );
  revalidatePath("/notifications");
}
