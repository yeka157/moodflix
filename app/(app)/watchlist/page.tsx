import type { Metadata } from "next";
import { WatchlistContent } from "@/components/watchlist/watchlist-content";

export const metadata: Metadata = {
  title: "Watchlist",
};

export default function WatchlistPage() {
  return (
    <div className="space-y-6">
      <WatchlistContent />
    </div>
  );
}
