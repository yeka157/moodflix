import { NextRequest } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/supabase/api-auth";
import { checkWindowedLimit, rateLimitResponse } from "@/lib/rate-limit";
import * as notificationsService from "@/lib/services/notifications";

const readSchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1).max(100).optional(),
    all: z.literal(true).optional(),
  })
  .refine((v) => v.ids !== undefined || v.all === true, {
    message: "ids or all required",
  });

export async function POST(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`notifications:${user.id}`, 60, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  const body: unknown = await request.json().catch(() => null);
  const parsed = readSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  if (parsed.data.all) {
    await notificationsService.markAllAsRead(user.id);
  } else {
    await notificationsService.markVisibleAsRead(user.id, parsed.data.ids!);
  }
  return Response.json({ success: true });
}
