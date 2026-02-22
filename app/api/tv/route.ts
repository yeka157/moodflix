import { NextRequest } from "next/server";
import {
  getTrendingTV,
  getTopRatedTV,
  discoverKoreanDramas,
  discoverChineseDramas,
} from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const page = Number(searchParams.get("page") ?? "1");

    switch (category) {
      case "trending":
        return Response.json(await getTrendingTV(page));
      case "top_rated":
        return Response.json(await getTopRatedTV(page));
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
