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

  const tmdbId = Number(request.nextUrl.searchParams.get("tmdbId"));
  const mediaTypeParam = request.nextUrl.searchParams.get("mediaType");
  const mediaType = mediaTypeParam === "tv" ? "tv" : "movie";

  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return Response.json({ error: "Invalid tmdbId" }, { status: 400 });
  }

  const item = await watchlistService.getWatchlistItemByTmdbId(
    user.id,
    tmdbId,
    mediaType,
  );
  return Response.json({ item });
}
