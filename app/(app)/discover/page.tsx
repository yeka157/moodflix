import type { Metadata } from "next";
import {
  getTrendingMovies,
  getPopularMovies,
  getTopRatedMovies,
} from "@/lib/tmdb";
import { DiscoverContent } from "@/components/movies/discover-content";

export const metadata: Metadata = {
  title: "Discover",
};

export default async function DiscoverPage() {
  const [trending, popular, topRated] = await Promise.all([
    getTrendingMovies(),
    getPopularMovies(),
    getTopRatedMovies(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Discover</h1>
        <p className="text-muted-foreground">Find your next favorite movie</p>
      </div>

      <DiscoverContent
        trending={trending.results}
        popular={popular.results}
        topRated={topRated.results}
      />
    </div>
  );
}
