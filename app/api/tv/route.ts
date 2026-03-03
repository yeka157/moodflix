import { NextRequest } from "next/server";
import {
  getTrendingTV,
  getTopRatedTV,
  getAiringTodayTV,
  discoverKoreanDramas,
  discoverChineseDramas,
  discoverTV,
  searchTV,
} from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const page = Number(searchParams.get("page") ?? "1");

    const query = searchParams.get("query");

    if (query) {
      const data = await searchTV(query, page);
      return Response.json(data);
    }

    const action = searchParams.get("action");
    const genre = searchParams.get("genre");
    const sortBy = searchParams.get("sort_by");
    const year = searchParams.get("year");
    const yearStart = searchParams.get("year_start");
    const yearEnd = searchParams.get("year_end");

    // New discover endpoint with genre + sort + year filters
    if (action === "discover") {
      const data = await discoverTV({
        genreIds: genre ?? undefined,
        sortBy: sortBy ?? undefined,
        year: year ?? undefined,
        yearStart: yearStart ?? undefined,
        yearEnd: yearEnd ?? undefined,
        page,
      });
      return Response.json(data);
    }

    switch (category) {
      case "trending":
        return Response.json(await getTrendingTV(page));
      case "top_rated":
        return Response.json(await getTopRatedTV(page));
      case "airing_today":
        return Response.json(await getAiringTodayTV(page));
      case "korean_drama":
        return Response.json(await discoverKoreanDramas(page));
      case "chinese_drama":
        return Response.json(await discoverChineseDramas(page));
      default:
        return Response.json(
          { error: "Provide valid 'category' parameter" },
          { status: 400 },
        );
    }
  } catch {
    return Response.json({ error: "Failed to fetch TV shows" }, { status: 500 });
  }
}
