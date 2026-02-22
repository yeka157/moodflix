import { NextRequest } from "next/server";
import { getTVDetails } from "@/lib/tmdb";
import { getCountryFromHeaders } from "@/lib/country";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (Number.isNaN(Number(id))) {
      return Response.json({ error: "Invalid TV show ID" }, { status: 400 });
    }

    const country = getCountryFromHeaders(request.headers);
    const details = await getTVDetails(Number(id));

    const providers =
      details["watch/providers"]?.results?.[country] || null;

    return Response.json({
      ...details,
      watchProviders: providers,
      watchCountry: country,
      mediaType: "tv" as const,
    });
  } catch {
    return Response.json(
      { error: "Failed to fetch TV details" },
      { status: 500 },
    );
  }
}
