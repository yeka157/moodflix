"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LibraryError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center px-4">
      <AlertCircle className="size-12 text-destructive mb-4" />
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        We couldn&apos;t load your library. This might be a temporary issue —
        please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
