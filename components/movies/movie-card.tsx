"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Star } from "lucide-react";
import type { Movie } from "@/types/movie";
import { cn, getPosterUrl } from "@/lib/utils";
import { GENRES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

interface MovieCardProps {
  movie: Movie;
  priority?: boolean;
  className?: string;
  onClick?: (movie: Movie) => void;
}

export function MovieCard({ movie, priority = false, className, onClick }: MovieCardProps) {
  const year = movie.release_date?.slice(0, 4) || "N/A";
  const rating = movie.vote_average.toFixed(1);
  const displayGenres = movie.genre_ids.slice(0, 2).map((id) => GENRES[id]).filter(Boolean);

  return (
    <motion.div
      className={cn("group relative cursor-pointer", className)}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={() => onClick?.(movie)}
    >
      <div className="relative aspect-2/3 overflow-hidden rounded-lg">
        <Image
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          priority={priority}
          className="object-cover"
          sizes="(max-width: 640px) 150px, (max-width: 768px) 170px, 185px"
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
            <h3 className="text-sm font-semibold text-white line-clamp-2">
              {movie.title}
            </h3>

            <div className="flex items-center gap-2 text-xs text-white/90">
              <span>{year}</span>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{rating}</span>
              </div>
            </div>

            {displayGenres.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {displayGenres.map((genre) => (
                  <Badge
                    key={genre}
                    variant="secondary"
                    className="bg-white/20 text-white border-0 text-[10px] px-1.5 py-0 h-4"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
