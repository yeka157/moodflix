import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/drizzle";
import { notificationSubscriptions } from "@/drizzle/schema";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({ tmdbId: notificationSubscriptions.tmdbId })
    .from(notificationSubscriptions)
    .where(eq(notificationSubscriptions.userId, user.id));

  return NextResponse.json({ tmdbIds: rows.map((r) => r.tmdbId) });
}
