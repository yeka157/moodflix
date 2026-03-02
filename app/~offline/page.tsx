import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
      <h1 className="font-display text-4xl">You&apos;re offline</h1>
      <p className="text-muted-foreground">
        Check your connection. Your cached library is still available.
      </p>
    </div>
  );
}
