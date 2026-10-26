import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle";
import { notificationSubscriptions, profiles } from "@/drizzle/schema";
import {
  MAX_RELEASE_SUBSCRIPTIONS,
  releaseSubscriptionSchema,
} from "@/lib/push-policy";
import { checkWindowedLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getApiUser } from "@/lib/supabase/api-auth";
import { getMovieDetails } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const user = await getApiUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`subscriptions:${user.id}`, 60, 60_000);
  if (!rate.allowed) {
    return rateLimitResponse(rate);
  }

  const tmdbId = request.nextUrl.searchParams.get("tmdbId");

  if (!tmdbId) {
    return NextResponse.json(
      { error: "Missing tmdbId parameter" },
      { status: 400 }
    );
  }

  const rows = await db
    .select({ id: notificationSubscriptions.id })
    .from(notificationSubscriptions)
    .where(
      and(
        eq(notificationSubscriptions.userId, user.id),
        eq(notificationSubscriptions.tmdbId, Number.parseInt(tmdbId, 10))
      )
    )
    .limit(1);

  return NextResponse.json({ subscribed: rows.length > 0 });
}

export async function POST(request: Request) {
  const user = await getApiUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`subscriptions:${user.id}`, 60, 60_000);
  if (!rate.allowed) {
    return rateLimitResponse(rate);
  }

  const parsed = releaseSubscriptionSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
  }
  const { tmdbId } = parsed.data;
  // Titles and release dates are server-owned; ignore caller-supplied values.
  let movie: Awaited<ReturnType<typeof getMovieDetails>>;
  try {
    movie = await getMovieDetails(tmdbId, AbortSignal.timeout(5000));
  } catch {
    return NextResponse.json(
      { error: "Unable to verify movie" },
      { status: 502 }
    );
  }
  const stored = await db.transaction(async (tx) => {
    await tx
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .for("update");
    const existing = await tx
      .select({ tmdbId: notificationSubscriptions.tmdbId })
      .from(notificationSubscriptions)
      .where(eq(notificationSubscriptions.userId, user.id));
    if (existing.some((subscription) => subscription.tmdbId === tmdbId)) {
      return true;
    }
    if (existing.length >= MAX_RELEASE_SUBSCRIPTIONS) {
      return false;
    }
    await tx
      .insert(notificationSubscriptions)
      .values({
        posterPath: movie.poster_path ?? null,
        releaseDate: movie.release_date || null,
        title: movie.title,
        tmdbId,
        userId: user.id,
      })
      .onConflictDoNothing({
        target: [
          notificationSubscriptions.userId,
          notificationSubscriptions.tmdbId,
        ],
      });
    return true;
  });
  if (!stored) {
    return NextResponse.json(
      {
        error: `Maximum ${MAX_RELEASE_SUBSCRIPTIONS} release subscriptions per account`,
      },
      { status: 409 }
    );
  }

  return NextResponse.json({ subscribed: true });
}

export async function DELETE(request: Request) {
  const user = await getApiUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`subscriptions:${user.id}`, 60, 60_000);
  if (!rate.allowed) {
    return rateLimitResponse(rate);
  }

  const body: unknown = await request.json();

  if (!body || typeof body !== "object" || !("tmdbId" in body)) {
    return NextResponse.json({ error: "Missing tmdbId" }, { status: 400 });
  }

  const { tmdbId } = body as { tmdbId: number };

  await db
    .delete(notificationSubscriptions)
    .where(
      and(
        eq(notificationSubscriptions.userId, user.id),
        eq(notificationSubscriptions.tmdbId, tmdbId)
      )
    );

  return NextResponse.json({ subscribed: false });
}
