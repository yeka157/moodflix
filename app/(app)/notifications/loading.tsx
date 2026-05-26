export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 md:px-8 py-8">
      <div className="mb-6 h-8 w-48 rounded bg-muted/40 animate-pulse" />
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="size-9 h-[54px] shrink-0 rounded bg-muted/40 animate-pulse" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 rounded bg-muted/40 animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-muted/40 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
