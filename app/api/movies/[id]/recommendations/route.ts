import { NextRequest } from "next/server";
import { getMovieRecommendations } from "@/lib/tmdb";

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

    const { searchParams } = request.nextUrl;
    const page = Number(searchParams.get("page") ?? "1");

    const data = await getMovieRecommendations(movieId, page);
    return Response.json(data);
  } catch {
    return Response.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 },
    );
  }
}
