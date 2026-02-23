import { Skeleton } from "@/components/ui/skeleton";

export default function SeriesLoading() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <Skeleton className="-mx-4 -mt-8 h-[50vh] min-h-[400px] max-h-[600px] rounded-none" />

      {/* Row skeletons */}
      {Array.from({ length: 5 }).map((_, rowIndex) => (
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
