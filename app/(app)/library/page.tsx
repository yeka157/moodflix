import type { Metadata } from "next";
import { WatchlistContent } from "@/components/watchlist/watchlist-content";

export const metadata: Metadata = {
  title: "My Library",
  description:
    "Manage your personal movie library. Track what you want to watch and what you've seen.",
};

export default function LibraryPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <WatchlistContent />
    </div>
  );
}
