import { NextRequest } from "next/server";
import {
  getTrendingMovies,
  getPopularMovies,
  getTopRatedMovies,
  searchMovies,
  discoverMoviesByGenre,
  discoverMovies,
} from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get("query");
    const category = searchParams.get("category");
    const page = Number(searchParams.get("page") ?? "1");

    const genre = searchParams.get("genre");
    const sortBy = searchParams.get("sort_by");
    const year = searchParams.get("year");
    const yearStart = searchParams.get("year_start");
    const yearEnd = searchParams.get("year_end");

    if (query) {
      const data = await searchMovies(query, page);
      return Response.json(data);
    }

    // New discover endpoint: supports genre + sortBy + year filters
    if (searchParams.get("action") === "discover" || (sortBy && !category)) {
      const data = await discoverMovies({
        genreIds: genre ?? undefined,
        sortBy: sortBy ?? undefined,
        year: year ?? undefined,
        yearStart: yearStart ?? undefined,
        yearEnd: yearEnd ?? undefined,
        page,
      });
      return Response.json(data);
    }

    if (genre) {
      const originCountry = searchParams.get("origin_country") ?? undefined;
      const data = await discoverMoviesByGenre(genre, page, originCountry);
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
