import type { Metadata } from "next";
import { WatchlistContent } from "@/components/watchlist/watchlist-content";

export const metadata: Metadata = {
  title: "Watchlist",
  description:
    "Manage your personal movie watchlist. Track what you want to watch, what you're watching, and what you've seen.",
};

export default function WatchlistPage() {
  return (
    <div className="space-y-6">
      <WatchlistContent />
    </div>
  );
}
