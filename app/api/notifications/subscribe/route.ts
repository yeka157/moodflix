import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/drizzle";
import { notificationSubscriptions } from "@/drizzle/schema";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tmdbId = request.nextUrl.searchParams.get("tmdbId");

  if (!tmdbId) {
    return NextResponse.json(
      { error: "Missing tmdbId parameter" },
      { status: 400 },
    );
  }

  const rows = await db
    .select({ id: notificationSubscriptions.id })
    .from(notificationSubscriptions)
    .where(
      and(
        eq(notificationSubscriptions.userId, user.id),
        eq(notificationSubscriptions.tmdbId, parseInt(tmdbId, 10)),
      ),
    )
    .limit(1);

  return NextResponse.json({ subscribed: rows.length > 0 });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json();

  if (
    !body ||
    typeof body !== "object" ||
    !("tmdbId" in body) ||
    !("title" in body)
  ) {
    return NextResponse.json(
      { error: "Missing tmdbId or title" },
      { status: 400 },
    );
  }

  const { tmdbId, title, posterPath, releaseDate } = body as {
    tmdbId: number;
    title: string;
    posterPath: string | null;
    releaseDate: string | null;
  };

  await db
    .insert(notificationSubscriptions)
    .values({
      userId: user.id,
      tmdbId,
      title,
      posterPath: posterPath ?? null,
      releaseDate: releaseDate ?? null,
    })
    .onConflictDoNothing({
      target: [
        notificationSubscriptions.userId,
        notificationSubscriptions.tmdbId,
      ],
    });

  return NextResponse.json({ subscribed: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        eq(notificationSubscriptions.tmdbId, tmdbId),
      ),
    );

  return NextResponse.json({ subscribed: false });
}
