import { NextRequest } from "next/server";
import { getApiUser } from "@/lib/supabase/api-auth";
import { checkWindowedLimit, rateLimitResponse } from "@/lib/rate-limit";
import * as notificationsService from "@/lib/services/notifications";

export async function GET(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`notifications:${user.id}`, 60, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  const cursor = request.nextUrl.searchParams.get("cursor");
  const limitParam = Number(request.nextUrl.searchParams.get("limit"));
  const limit =
    Number.isInteger(limitParam) && limitParam > 0 ? limitParam : undefined;

  const page = await notificationsService.listNotifications(user.id, {
    cursor,
    limit,
  });
  return Response.json(page);
}
