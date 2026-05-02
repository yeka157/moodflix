import type { Metadata } from "next";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { DiscoverGridContent } from "@/components/movies/discover-grid-content";
import { movieKeys, getDefaultDiscoverParams } from "@/lib/movie-keys";
import { discoverMovies } from "@/lib/tmdb";

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Browse movies by genre, release year, and more. Filter and discover your next favorite film.",
  openGraph: {
    title: "Discover Movies on Moodflix",
    description:
      "Browse movies by genre, release year, and more. Filter and discover your next favorite film.",
  },
};

export default async function DiscoverPage() {
  const queryClient = new QueryClient();
  const defaultParams = getDefaultDiscoverParams();

  await queryClient.prefetchInfiniteQuery({
    queryKey: movieKeys.discover(defaultParams),
    queryFn: ({ pageParam }) =>
      discoverMovies({
        sortBy: defaultParams.sortBy,
        page: pageParam as number,
      }),
    initialPageParam: 1,
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Discover</h1>
        <p className="text-muted-foreground">Find your next favorite movie</p>
      </div>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <DiscoverGridContent />
      </HydrationBoundary>
    </div>
  );
}
