import { NextRequest } from "next/server";
import { getCachedMovieDetails } from "@/lib/tmdb-cache";
import { getCountryFromHeaders } from "@/lib/country";
import { getApiUser } from "@/lib/supabase/api-auth";
import { checkWindowedLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getApiUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rate = checkWindowedLimit(`movies:${user.id}`, 60, 60_000);
    if (!rate.allowed) return rateLimitResponse(rate);

    const { id } = await params;
    const movieId = Number(id);

    if (Number.isNaN(movieId)) {
      return Response.json({ error: "Invalid movie ID" }, { status: 400 });
    }

    const country = getCountryFromHeaders(request.headers);
    const details = await getCachedMovieDetails(movieId);

    const providers =
      details["watch/providers"]?.results?.[country] || null;

    return Response.json({
      ...details,
      watchProviders: providers,
      watchCountry: country,
    });
  } catch {
    return Response.json(
      { error: "Failed to fetch movie details" },
      { status: 500 },
    );
  }
}
