import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getApiUser } from "@/lib/supabase/api-auth";
import { checkWindowedLimit, rateLimitResponse } from "@/lib/rate-limit";
import { db } from "@/drizzle";
import { notificationSubscriptions } from "@/drizzle/schema";

export async function GET(request: NextRequest) {
  const user = await getApiUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`subscriptions:${user.id}`, 60, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  const rows = await db
    .select({ tmdbId: notificationSubscriptions.tmdbId })
    .from(notificationSubscriptions)
    .where(eq(notificationSubscriptions.userId, user.id));

  return NextResponse.json({ tmdbIds: rows.map((r) => r.tmdbId) });
}
