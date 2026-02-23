import { Skeleton } from "@/components/ui/skeleton";

export default function TVDetailLoading() {
  return (
    <div className="min-h-screen pb-16 md:pb-8">
      {/* Backdrop skeleton */}
      <div className="relative w-full h-[50vh] min-h-[300px]">
        <Skeleton className="w-full h-full rounded-none" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 space-y-2">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-6 mt-6">
        {/* Metadata pills */}
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-14 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-7 w-10 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>

        {/* Genre tags */}
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>

        {/* Overview */}
        <div className="space-y-2 max-w-3xl">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Created by */}
        <Skeleton className="h-4 w-48" />

        {/* Cast chips */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-24 rounded-full" />
            ))}
          </div>
        </div>

        {/* Watch providers */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-48 rounded-md" />
          <div className="flex gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
