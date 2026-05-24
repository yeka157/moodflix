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
    <div
      className="page section"
      style={{ paddingTop: 24, paddingBottom: 120 }}
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <DiscoverGridContent />
      </HydrationBoundary>
    </div>
  );
}
