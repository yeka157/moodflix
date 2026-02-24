import { WatchlistSkeleton } from "@/components/watchlist/watchlist-skeleton";

export default function WatchlistLoading() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <WatchlistSkeleton />
    </div>
  );
}
