import { Compass } from "lucide-react";

export default function DiscoverPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Compass className="size-12 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">Discover Movies</h1>
      <p className="text-muted-foreground">
        Browse and search for movies. Coming soon.
      </p>
    </div>
  );
}
