import { NextRequest } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/supabase/api-auth";
import { checkWindowedLimit, rateLimitResponse } from "@/lib/rate-limit";
import * as watchlistService from "@/lib/services/watchlist";

const addSchema = z.object({
  tmdbId: z.number().int().positive(),
  title: z.string().min(1).max(500),
  posterPath: z.string().nullable(),
  status: z.enum(["want_to_watch", "watched"]).optional(),
  mediaType: z.enum(["movie", "tv"]).optional(),
});

export async function GET(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`watchlist:${user.id}`, 60, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  const statusParam = request.nextUrl.searchParams.get("status");
  const status =
    statusParam === "want_to_watch" || statusParam === "watched"
      ? statusParam
      : undefined;

  const items = await watchlistService.getWatchlist(user.id, status);
  return Response.json({ items });
}

export async function POST(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`watchlist:${user.id}`, 60, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  const body: unknown = await request.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const result = await watchlistService.addToWatchlist(user.id, parsed.data);
  if (result.error) {
    const status = result.error === "Already in library" ? 409 : 500;
    return Response.json({ error: result.error }, { status });
  }
  return Response.json({ item: result.item }, { status: 201 });
}
