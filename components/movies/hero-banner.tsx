"use client";

import { motion } from "framer-motion";
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

export function HeroBanner({ movie }: HeroBannerProps) {
  const year = movie.release_date?.slice(0, 4) || "N/A";
  const displayGenres = movie.genre_ids
    .slice(0, 3)
    .map((id) => GENRES[id])
    .filter(Boolean);

  return (
    <motion.div
      className="relative -mx-4 -mt-8 h-[50vh] min-h-[400px] max-h-[600px] overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      {/* Backdrop image */}
      <Image
        src={getBackdropUrl(movie.backdrop_path, "lg")}
        alt={movie.title}
        fill
        priority
        className="object-cover object-top"
        sizes="100vw"
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 space-y-3 sm:space-y-4">
        {/* Genre badges and year */}
        <div className="flex gap-2 flex-wrap">
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
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
          {movie.title}
        </h1>

        {/* Overview */}
        <p className="text-sm sm:text-base text-white/80 line-clamp-3 max-w-lg">
          {movie.overview}
        </p>

        {/* CTA Button */}
        <Button asChild size="lg" className="gap-2">
          <Link href="/discover">
            <Play className="h-5 w-5" />
            Discover More
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
