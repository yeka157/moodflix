import { NextRequest } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/supabase/api-auth";
import { checkWindowedLimit, rateLimitResponse } from "@/lib/rate-limit";
import * as watchlistService from "@/lib/services/watchlist";
import type { WatchlistActionResult } from "@/types/watchlist";

const patchSchema = z
  .object({
    status: z.enum(["want_to_watch", "watched"]).optional(),
    rating: z.union([z.literal(1), z.literal(-1), z.null()]).optional(),
  })
  .refine((v) => v.status !== undefined || v.rating !== undefined, {
    message: "status or rating required",
  });

function errorResponse(message: string): Response {
  return Response.json(
    { error: message },
    { status: message === "Item not found" ? 404 : 500 },
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`watchlist:${user.id}`, 60, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  let result: WatchlistActionResult | null = null;
  if (parsed.data.status !== undefined) {
    result = await watchlistService.updateWatchlistStatus(
      user.id,
      id,
      parsed.data.status,
    );
    if (result.error) return errorResponse(result.error);
  }
  if (parsed.data.rating !== undefined) {
    result = await watchlistService.rateWatchlistItem(
      user.id,
      id,
      parsed.data.rating,
    );
    if (result.error) return errorResponse(result.error);
  }

  return Response.json({ item: result?.item });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = checkWindowedLimit(`watchlist:${user.id}`, 60, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate);

  const { id } = await params;
  const result = await watchlistService.removeFromWatchlist(user.id, id);
  if (result.error) {
    return Response.json({ error: result.error }, { status: 500 });
  }
  return Response.json({ success: true });
}
