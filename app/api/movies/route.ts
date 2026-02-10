import { NextRequest } from "next/server";
import {
  getTrendingMovies,
  getPopularMovies,
  getTopRatedMovies,
  searchMovies,
  discoverMoviesByGenre,
} from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get("query");
    const category = searchParams.get("category");
    const page = Number(searchParams.get("page") ?? "1");

    const genre = searchParams.get("genre");

    if (query) {
      const data = await searchMovies(query, page);
      return Response.json(data);
    }

    if (genre) {
      const data = await discoverMoviesByGenre(genre, page);
      return Response.json(data);
    }

    switch (category) {
      case "trending":
        return Response.json(await getTrendingMovies(page));
      case "popular":
        return Response.json(await getPopularMovies(page));
      case "top_rated":
        return Response.json(await getTopRatedMovies(page));
      default:
        return Response.json(
          { error: "Provide 'query', 'genre', or 'category' parameter" },
          { status: 400 },
        );
    }
  } catch {
    return Response.json({ error: "Failed to fetch movies" }, { status: 500 });
  }
}
