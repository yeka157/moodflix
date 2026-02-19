"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import type { Movie } from "@/types/movie";
import { getBackdropUrl } from "@/lib/utils";
import { GENRES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HeroBannerProps {
  movie: Movie;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.25 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

export function HeroBanner({ movie }: HeroBannerProps) {
  const shouldReduceMotion = useReducedMotion();
  const year = movie.release_date?.slice(0, 4) || "N/A";
  const displayGenres = movie.genre_ids
    .slice(0, 3)
    .map((id) => GENRES[id])
    .filter(Boolean);

  return (
    <div className="relative -mx-4 -mt-8 h-[50vh] min-h-[400px] max-h-[600px] overflow-hidden">
      {/* Backdrop image — cinematic scale-in */}
      <motion.div
        className="absolute inset-0"
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Image
          src={getBackdropUrl(movie.backdrop_path, "lg")}
          alt={movie.title}
          fill
          priority
          className="object-cover object-top"
          sizes="100vw"
        />
      </motion.div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

      {/* Content — staggered children */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 space-y-3 sm:space-y-4"
        variants={shouldReduceMotion ? undefined : containerVariants}
        initial={shouldReduceMotion ? false : "hidden"}
        animate={shouldReduceMotion ? undefined : "visible"}
      >
        {/* Genre badges and year */}
        <motion.div
          className="flex gap-2 flex-wrap"
          variants={shouldReduceMotion ? undefined : itemVariants}
        >
          {displayGenres.map((genre) => (
            <Badge
              key={genre}
              variant="secondary"
              className="bg-white/10 text-white border-0 text-xs"
            >
              {genre}
            </Badge>
          ))}
          <Badge variant="secondary" className="bg-white/10 text-white border-0 text-xs">
            {year}
          </Badge>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white"
          variants={shouldReduceMotion ? undefined : itemVariants}
        >
          {movie.title}
        </motion.h1>

        {/* Overview */}
        <motion.p
          className="text-sm sm:text-base text-white/80 line-clamp-3 max-w-lg"
          variants={shouldReduceMotion ? undefined : itemVariants}
        >
          {movie.overview}
        </motion.p>

        {/* CTA Button */}
        <motion.div variants={shouldReduceMotion ? undefined : itemVariants}>
          <Button asChild size="lg" className="gap-2">
            <Link href="/discover">
              <Play className="h-5 w-5" />
              Discover More
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
