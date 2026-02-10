import { NextRequest } from "next/server";
import { getMovieDetails } from "@/lib/tmdb";
import { getCountryFromHeaders } from "@/lib/country";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const movieId = Number(id);

    if (Number.isNaN(movieId)) {
      return Response.json({ error: "Invalid movie ID" }, { status: 400 });
    }

    const country = getCountryFromHeaders(request.headers);
    const details = await getMovieDetails(movieId);

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
