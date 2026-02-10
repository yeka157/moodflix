import { Bookmark } from "lucide-react";

export default function WatchlistPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Bookmark className="size-12 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">Your Watchlist</h1>
      <p className="text-muted-foreground">
        Your personal movie collection. Coming soon.
      </p>
    </div>
  );
}
