import { eq, and, sql, notInArray } from "drizzle-orm";

import { db } from "@/drizzle";
import {
  notificationSubscriptions,
  pushSubscriptions,
  tmdbMedia,
} from "@/drizzle/schema";
import { sendPushNotification } from "@/lib/web-push";
import type { PushPayload } from "@/types/push";

export const maxDuration = 30;

interface ReleaseMatch {
  userId: string;
  tmdbId: number;
  title: string;
  posterPath: string | null;
}

export async function GET(request: Request) {
  // 1. Auth guard (Vercel Cron)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Today's date in UTC as YYYY-MM-DD
  const today = new Date().toISOString().slice(0, 10);
  const startOfToday = new Date(`${today}T00:00:00.000Z`);

  // 3. Find movies releasing today via tmdb_media join
  const tmdbMatches = await db
    .select({
      userId: notificationSubscriptions.userId,
      tmdbId: notificationSubscriptions.tmdbId,
      title: tmdbMedia.title,
      posterPath: tmdbMedia.posterPath,
    })
    .from(notificationSubscriptions)
    .innerJoin(
      tmdbMedia,
      and(
        eq(tmdbMedia.tmdbId, notificationSubscriptions.tmdbId),
        eq(tmdbMedia.mediaType, "movie")
      )
    )
    .where(
      and(
        eq(tmdbMedia.releaseDate, today),
        sql`(${notificationSubscriptions.lastNotifiedAt} IS NULL OR ${notificationSubscriptions.lastNotifiedAt} < ${startOfToday})`
      )
    );

  // Collect tmdbIds already matched via tmdb_media
  const matchedTmdbIds = tmdbMatches.map((m) => m.tmdbId);

  // 4. Fallback: notification_subscriptions with releaseDate = today but no tmdb_media row
  const fallbackMatches =
    matchedTmdbIds.length > 0
      ? await db
          .select({
            userId: notificationSubscriptions.userId,
            tmdbId: notificationSubscriptions.tmdbId,
            title: notificationSubscriptions.title,
            posterPath: notificationSubscriptions.posterPath,
          })
          .from(notificationSubscriptions)
          .where(
            and(
              eq(notificationSubscriptions.releaseDate, today),
              notInArray(notificationSubscriptions.tmdbId, matchedTmdbIds),
              sql`(${notificationSubscriptions.lastNotifiedAt} IS NULL OR ${notificationSubscriptions.lastNotifiedAt} < ${startOfToday})`
            )
          )
      : await db
          .select({
            userId: notificationSubscriptions.userId,
            tmdbId: notificationSubscriptions.tmdbId,
            title: notificationSubscriptions.title,
            posterPath: notificationSubscriptions.posterPath,
          })
          .from(notificationSubscriptions)
          .where(
            and(
              eq(notificationSubscriptions.releaseDate, today),
              sql`(${notificationSubscriptions.lastNotifiedAt} IS NULL OR ${notificationSubscriptions.lastNotifiedAt} < ${startOfToday})`
            )
          );

  const allMatches: ReleaseMatch[] = [...tmdbMatches, ...fallbackMatches];

  if (allMatches.length === 0) {
    return Response.json({ success: true, notified: 0, movies: 0 });
  }

  // 5. Group by userId
  const userMovies = new Map<string, ReleaseMatch[]>();
  for (const match of allMatches) {
    const existing = userMovies.get(match.userId) ?? [];
    existing.push(match);
    userMovies.set(match.userId, existing);
  }

  const uniqueMovieIds = new Set(allMatches.map((m) => m.tmdbId));
  let totalNotificationsSent = 0;
  let staleSubscriptionsRemoved = 0;
  const notifiedPairs: { userId: string; tmdbId: number }[] = [];

  // 6-7. For each user, get devices and send notifications
  for (const [userId, movies] of userMovies) {
    const devices = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (devices.length === 0) continue;

    // One notification per movie per device
    const sendPromises: {
      promise: Promise<unknown>;
      endpoint: string;
      tmdbId: number;
    }[] = [];

    for (const movie of movies) {
      const payload: PushPayload = {
        title: "Now Available!",
        body: movie.title,
        url: `/movie/${movie.tmdbId}`,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
      };

      for (const device of devices) {
        sendPromises.push({
          promise: sendPushNotification(
            {
              endpoint: device.endpoint,
              p256dh: device.p256dh,
              auth: device.auth,
            },
            payload
          ),
          endpoint: device.endpoint,
          tmdbId: movie.tmdbId,
        });
      }
    }

    const results = await Promise.allSettled(
      sendPromises.map((s) => s.promise)
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const { endpoint, tmdbId } = sendPromises[i];

      if (result.status === "fulfilled") {
        totalNotificationsSent++;
        notifiedPairs.push({ userId, tmdbId });
      } else {
        // Stale subscription cleanup
        const error = result.reason as { statusCode?: number };
        if (error.statusCode === 410 || error.statusCode === 404) {
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.endpoint, endpoint));
          staleSubscriptionsRemoved++;
        }
      }
    }
  }

  // 8. Update lastNotifiedAt for notified subscriptions
  const uniqueNotified = new Map<string, Set<number>>();
  for (const pair of notifiedPairs) {
    const set = uniqueNotified.get(pair.userId) ?? new Set<number>();
    set.add(pair.tmdbId);
    uniqueNotified.set(pair.userId, set);
  }

  for (const [userId, tmdbIds] of uniqueNotified) {
    for (const tmdbId of tmdbIds) {
      await db
        .update(notificationSubscriptions)
        .set({ lastNotifiedAt: new Date() })
        .where(
          and(
            eq(notificationSubscriptions.userId, userId),
            eq(notificationSubscriptions.tmdbId, tmdbId)
          )
        );
    }
  }

  // 9. Return summary
  return Response.json({
    success: true,
    movies: uniqueMovieIds.size,
    users: userMovies.size,
    notified: totalNotificationsSent,
    staleRemoved: staleSubscriptionsRemoved,
  });
}
