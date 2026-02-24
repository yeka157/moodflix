import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero banner skeleton */}
      <Skeleton className="relative w-full aspect-[21/9] rounded-xl" />

      {/* Welcome greeting skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Mood section skeleton */}
      <Skeleton className="h-32 w-full rounded-xl" />

      {/* Movie rows skeleton */}
      {Array.from({ length: 2 }).map((_, rowIndex) => (
        <div key={rowIndex} className="space-y-3">
          <Skeleton className="h-7 w-48" />
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
