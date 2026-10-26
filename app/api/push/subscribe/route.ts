import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/drizzle";
import { profiles, pushSubscriptions } from "@/drizzle/schema";
import { MAX_PUSH_DEVICES, pushSubscriptionSchema } from "@/lib/push-policy";
import { checkWindowedLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getApiUser } from "@/lib/supabase/api-auth";

export async function POST(request: Request) {
  const user = await getApiUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`push:${user.id}`, 60, 60_000);
  if (!rate.allowed) {
    return rateLimitResponse(rate);
  }

  const parsed = pushSubscriptionSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid or unsupported push subscription" },
      { status: 400 }
    );
  }
  const { endpoint, keys } = parsed.data;
  const stored = await db.transaction(async (tx) => {
    // Serialize registrations for this account so concurrent requests cannot
    // pass the device cap together. No schema migration is required.
    await tx
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .for("update");
    const existing = await tx
      .select({ endpoint: pushSubscriptions.endpoint })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, user.id));
    if (
      !existing.some((device) => device.endpoint === endpoint) &&
      existing.length >= MAX_PUSH_DEVICES
    ) {
      return false;
    }
    await tx
      .insert(pushSubscriptions)
      .values({
        auth: keys.auth,
        endpoint,
        p256dh: keys.p256dh,
        userId: user.id,
      })
      .onConflictDoUpdate({
        set: { auth: keys.auth, p256dh: keys.p256dh, userId: user.id },
        target: pushSubscriptions.endpoint,
      });
    return true;
  });
  if (!stored) {
    return NextResponse.json(
      { error: `Maximum ${MAX_PUSH_DEVICES} push devices per account` },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const user = await getApiUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`push:${user.id}`, 60, 60_000);
  if (!rate.allowed) {
    return rateLimitResponse(rate);
  }

  const body: unknown = await request.json();

  if (!body || typeof body !== "object" || !("endpoint" in body)) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  const { endpoint } = body as { endpoint: string };

  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.endpoint, endpoint),
        eq(pushSubscriptions.userId, user.id)
      )
    );

  return NextResponse.json({ success: true });
}
