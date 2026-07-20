import { NextRequest } from "next/server";
import { getApiUser } from "@/lib/supabase/api-auth";
import { checkWindowedLimit, rateLimitResponse } from "@/lib/rate-limit";
import * as watchlistService from "@/lib/services/watchlist";

export async function GET(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`watchlist:${user.id}`, 60, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  const stats = await watchlistService.getWatchlistStats(user.id);
  return Response.json(stats);
}
