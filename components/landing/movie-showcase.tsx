"use client";

import { Film, Popcorn, Clapperboard, Camera, Video, Tv } from "lucide-react";
import { cn } from "@/lib/utils";

const posters = [
  { gradient: "from-purple-600 to-pink-600", icon: Film },
  { gradient: "from-blue-600 to-cyan-600", icon: Popcorn },
  { gradient: "from-green-600 to-emerald-600", icon: Clapperboard },
  { gradient: "from-orange-600 to-red-600", icon: Camera },
  { gradient: "from-indigo-600 to-purple-600", icon: Video },
  { gradient: "from-rose-600 to-pink-600", icon: Tv },
  { gradient: "from-teal-600 to-cyan-600", icon: Film },
  { gradient: "from-amber-600 to-orange-600", icon: Popcorn },
];

function PosterCard({
  gradient,
  icon: Icon,
}: {
  gradient: string;
  icon: typeof Film;
}) {
  return (
    <div
      className={cn(
        "flex-shrink-0 w-40 aspect-[2/3] rounded-xl bg-gradient-to-br",
        gradient,
        "opacity-70 hover:opacity-100 transition-opacity duration-300",
        "flex items-center justify-center",
      )}
    >
      <Icon className="size-12 text-white/80" />
    </div>
  );
}

export function MovieShowcase() {
  return (
    <section className="py-24 px-4 overflow-hidden">
      <div className="mx-auto max-w-6xl mb-12">
        <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-center mb-4">
          Thousands of Movies at Your Fingertips
        </h2>
        <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">
          From classics to the latest releases, explore an ever-growing
          collection
        </p>
      </div>

      <div className="relative">
        {/* Gradient fade edges */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background via-background/50 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background via-background/50 to-transparent z-10 pointer-events-none" />

        {/* First row - scrolling left */}
        <div className="mb-6">
          <div
            className="flex gap-6 motion-safe:[animation:marquee-left_40s_linear_infinite]"
          >
            {[...posters, ...posters].map((poster, index) => (
              <PosterCard key={`row1-${index}`} {...poster} />
            ))}
          </div>
        </div>

        {/* Second row - scrolling right */}
        <div>
          <div
            className="flex gap-6 motion-safe:[animation:marquee-right_40s_linear_infinite]"
          >
            {[...posters, ...posters].map((poster, index) => (
              <PosterCard key={`row2-${index}`} {...poster} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
