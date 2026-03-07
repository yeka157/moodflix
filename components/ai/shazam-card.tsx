"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPosterUrl } from "@/lib/utils";
import type { IdentifiedMedia } from "@/types/ai";

type ShazamCardProps = Pick<
  IdentifiedMedia,
  "title" | "tmdbId" | "mediaType" | "year" | "posterPath" | "overview"
>;

export function ShazamCard({
  title,
  tmdbId,
  mediaType,
  year,
  posterPath,
  overview,
}: ShazamCardProps) {
  // Fallback when TMDB could not verify the title
  if (tmdbId === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-muted bg-muted/30 p-4 max-w-sm">
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t find an exact match. Try describing more details about
            the plot, characters, or scenes.
          </p>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-primary/20 bg-primary/5 max-w-sm overflow-hidden">
        <div className="flex gap-3 p-3">
          {/* Poster thumbnail */}
          <div className="w-16 shrink-0">
            <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-muted">
              <Image
                src={getPosterUrl(posterPath, "sm")}
                alt={`${title} poster`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          </div>

          {/* Text content */}
          <div className="flex flex-col justify-between min-w-0 py-0.5">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm line-clamp-1">{title}</h3>
              {year && (
                <p className="text-xs text-muted-foreground">{year}</p>
              )}
              {overview && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {overview}
                </p>
              )}
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-1.5 h-7 px-2 w-fit text-primary hover:text-primary hover:bg-primary/10"
            >
              <Link href={`/${mediaType}/${tmdbId}`}>
                Details
                <ExternalLink className="size-3" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
