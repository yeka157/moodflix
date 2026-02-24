import { Skeleton } from "@/components/ui/skeleton";

export default function DiscoverLoading() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>

      <Skeleton className="h-12 max-w-xl rounded-md" />

      {Array.from({ length: 3 }).map((_, rowIndex) => (
        <div key={rowIndex} className="space-y-3">
          <Skeleton className="h-7 w-40" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-shrink-0 w-[185px] aspect-[2/3] rounded-lg"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
