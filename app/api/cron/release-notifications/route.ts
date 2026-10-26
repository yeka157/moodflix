import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/drizzle";
import {
  notificationSubscriptions,
  notifications,
  pushSubscriptions,
  tmdbMedia,
} from "@/drizzle/schema";
import {
  MAX_PUSH_DEVICES,
  MAX_PUSH_SENDS_PER_RUN,
  MAX_PUSH_SENDS_PER_USER,
  MAX_RELEASES_PER_RUN,
  PUSH_JOB_BUDGET_MS,
  PUSH_TIMEOUT_MS,
} from "@/lib/push-policy";
import { getMovieDetails } from "@/lib/tmdb";
import { sendPushNotification } from "@/lib/web-push";
import type { PushSubscriptionRecord, ReleaseMatch } from "@/types/push";

export const maxDuration = 30;

export async function GET(request: Request) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const deadline = Date.now() + PUSH_JOB_BUDGET_MS;
  const today = new Date().toISOString().slice(0, 10);
  // Include overdue, unsent releases so work deferred by the budget survives
  // the next day's run. Bound the read as well as the outgoing requests.
  const matches = await db
    .select({
      catalogId: tmdbMedia.tmdbId,
      id: notificationSubscriptions.id,
      posterPath: tmdbMedia.posterPath,
      title: tmdbMedia.title,
      tmdbId: notificationSubscriptions.tmdbId,
      userId: notificationSubscriptions.userId,
    })
    .from(notificationSubscriptions)
    .leftJoin(
      tmdbMedia,
      and(
        eq(tmdbMedia.tmdbId, notificationSubscriptions.tmdbId),
        eq(tmdbMedia.mediaType, "movie")
      )
    )
    .where(
      and(
        isNull(notificationSubscriptions.lastNotifiedAt),
        sql`exists (select 1 from ${pushSubscriptions} where ${pushSubscriptions.userId} = ${notificationSubscriptions.userId})`,
        sql`(case when ${tmdbMedia.tmdbId} is not null then ${tmdbMedia.releaseDate} else ${notificationSubscriptions.releaseDate} end) <= ${today}`
      )
    )
    .orderBy(
      asc(notificationSubscriptions.createdAt),
      asc(notificationSubscriptions.id)
    )
    .limit(MAX_RELEASES_PER_RUN);

  let attempted = 0;
  let notified = 0;
  let staleRemoved = 0;
  let processed = 0;
  const userAttempts = new Map<string, number>();

  for (const match of matches) {
    if (
      Date.now() + PUSH_TIMEOUT_MS >= deadline ||
      attempted >= MAX_PUSH_SENDS_PER_RUN
    ) {
      break;
    }
    const userCount = userAttempts.get(match.userId) ?? 0;
    if (userCount >= MAX_PUSH_SENDS_PER_USER) {
      continue;
    }

    // biome-ignore lint/performance/noAwaitInLoops: sequential release groups enforce the push concurrency budget
    const release = await verifyRelease(match, today);
    if (!release || Date.now() + PUSH_TIMEOUT_MS >= deadline) {
      continue;
    }
    const { title, posterPath } = release;

    const devices = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, match.userId))
      .orderBy(asc(pushSubscriptions.createdAt))
      .limit(MAX_PUSH_DEVICES);
    if (Date.now() + PUSH_TIMEOUT_MS >= deadline) {
      break;
    }
    // Keep the full device group together; partial groups must not mark a
    // release sent while silently dropping devices due to a work budget.
    if (
      attempted + devices.length > MAX_PUSH_SENDS_PER_RUN ||
      userCount + devices.length > MAX_PUSH_SENDS_PER_USER
    ) {
      continue;
    }
    attempted += devices.length;
    userAttempts.set(match.userId, userCount + devices.length);
    const sent = await deliverRelease(devices, match, title);
    notified += sent.notified;
    staleRemoved += sent.staleRemoved;
    if (!sent.notified) {
      continue;
    }
    // Persist progress per release, so later slow sends cannot discard all of
    // this run's progress.
    await db.transaction(async (tx) => {
      await tx.insert(notifications).values({
        body: null,
        href: `/movie/${match.tmdbId}`,
        mediaType: "movie",
        posterPath,
        title: `${title} is now available`,
        tmdbId: match.tmdbId,
        type: "release",
        userId: match.userId,
      });
      await tx
        .update(notificationSubscriptions)
        .set({ lastNotifiedAt: new Date() })
        .where(eq(notificationSubscriptions.id, match.id));
    });
    processed += 1;
  }
  return Response.json({
    attempted,
    deferred: matches.length - processed,
    notified,
    processed,
    staleRemoved,
    success: true,
  });
}

async function verifyRelease(match: ReleaseMatch, today: string) {
  if (match.catalogId !== null) {
    return match.title
      ? { posterPath: match.posterPath, title: match.title }
      : null;
  }
  // Existing fallback rows predate server-side metadata validation.
  try {
    const movie = await getMovieDetails(
      match.tmdbId,
      AbortSignal.timeout(PUSH_TIMEOUT_MS)
    );
    await db
      .update(notificationSubscriptions)
      .set({
        posterPath: movie.poster_path,
        releaseDate: movie.release_date || null,
        title: movie.title,
      })
      .where(eq(notificationSubscriptions.id, match.id));
    if (!movie.release_date || movie.release_date > today) {
      return null;
    }
    return { posterPath: movie.poster_path, title: movie.title };
  } catch {
    return null;
  }
}

function isExpiredPushError(error: unknown) {
  return (
    error !== null &&
    typeof error === "object" &&
    "statusCode" in error &&
    (error.statusCode === 404 || error.statusCode === 410)
  );
}

async function deliverRelease(
  devices: PushSubscriptionRecord[],
  match: ReleaseMatch,
  title: string
) {
  const results = await Promise.allSettled(
    devices.map((device) =>
      sendPushNotification(device, {
        badge: "/icons/icon-72x72.png",
        body: title,
        icon: "/icons/icon-192x192.png",
        title: "Now Available!",
        url: `/movie/${match.tmdbId}`,
      })
    )
  );
  const stale = devices.filter((_, index) => {
    const result = results[index];
    return result.status === "rejected" && isExpiredPushError(result.reason);
  });
  await Promise.all(
    stale.map((device) =>
      db
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.id, device.id),
            eq(pushSubscriptions.userId, match.userId)
          )
        )
    )
  );
  return {
    notified: results.filter((result) => result.status === "fulfilled").length,
    staleRemoved: stale.length,
  };
}
