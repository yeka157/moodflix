import { NextRequest } from "next/server";
import { searchMulti } from "@/lib/tmdb";

const MAX_QUERY_LENGTH = 200;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";

  if (!query.trim()) {
    return Response.json({ results: [] });
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return Response.json(
      { results: [], error: "Query too long" },
      { status: 400 },
    );
  }

  try {
    const results = await searchMulti(query.trim(), 20);
    return Response.json({ results });
  } catch (error) {
    console.error("[api/movies/multi] TMDB search failed", error);
    return Response.json({ results: [] });
  }
}
