"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { ShowcasePoster } from "@/lib/tmdb";

interface MovieShowcaseProps {
  posters: ShowcasePoster[];
}

function PosterCard({ title, posterUrl }: ShowcasePoster) {
  return (
    <div className="flex-shrink-0 w-40 hover:scale-105 transition-transform duration-300 cursor-default">
      <div className="relative w-40 aspect-[2/3] rounded-lg overflow-hidden shadow-lg">
        <Image
          src={posterUrl}
          alt={title}
          fill
          sizes="160px"
          className="object-cover"
          unoptimized
        />
      </div>
    </div>
  );
}

export function MovieShowcase({ posters }: MovieShowcaseProps) {
  const shouldReduceMotion = useReducedMotion();

  if (posters.length === 0) return null;

  // Duplicate for seamless marquee loop
  const row1 = [...posters, ...posters];
  const row2 = [...posters, ...posters];

  return (
    <section className="py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 mb-12">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const }}
          className="text-center"
        >
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Trending Now
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From classics to the latest releases, explore an ever-growing
            collection of films and series.
          </p>
        </motion.div>
      </div>

      <div className="relative">
        {/* Gradient fade — left edge */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background via-background/60 to-transparent z-10 pointer-events-none" />
        {/* Gradient fade — right edge */}
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background via-background/60 to-transparent z-10 pointer-events-none" />

        {/* Row 1: scrolling left */}
        <div className="mb-6 overflow-hidden">
          <div className="flex gap-6 motion-safe:[animation:marquee-left_40s_linear_infinite] motion-reduce:[animation-play-state:paused]">
            {row1.map((poster, index) => (
              <PosterCard key={`row1-${index}`} {...poster} />
            ))}
          </div>
        </div>

        {/* Row 2: scrolling right */}
        <div className="overflow-hidden">
          <div className="flex gap-6 motion-safe:[animation:marquee-right_40s_linear_infinite] motion-reduce:[animation-play-state:paused]">
            {row2.map((poster, index) => (
              <PosterCard key={`row2-${index}`} {...poster} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
