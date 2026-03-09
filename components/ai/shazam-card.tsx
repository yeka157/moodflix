"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, getPosterUrl } from "@/lib/utils";
import type { IdentifiedMedia } from "@/types/ai";

const CONFIDENCE_CONFIG = {
  high: { label: "High match", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  medium: { label: "Possible match", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
  low: { label: "Long shot", className: "bg-muted text-muted-foreground border-muted" },
} as const;

type ShazamCardProps = Pick<
  IdentifiedMedia,
  "title" | "tmdbId" | "mediaType" | "year" | "posterPath" | "overview" | "confidence"
> & {
  showConfidence?: boolean;
};

export function ShazamCard({
  title,
  tmdbId,
  mediaType,
  year,
  posterPath,
  overview,
  confidence,
  showConfidence = false,
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
      <Card className="border-primary/20 bg-primary/5 max-w-sm overflow-hidden relative">
        {showConfidence && confidence && (
          <Badge
            variant="outline"
            className={cn(
              "absolute top-2 right-2 text-[10px] px-1.5 py-0",
              CONFIDENCE_CONFIG[confidence].className,
            )}
          >
            {CONFIDENCE_CONFIG[confidence].label}
          </Badge>
        )}
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

type ShazamCardListProps = {
  matches: IdentifiedMedia[];
  query: string;
};

export function ShazamCardList({ matches, query }: ShazamCardListProps) {
  if (matches.length === 0) {
    return (
      <Card className="border-muted bg-muted/30 p-4 max-w-sm">
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t find a match for &ldquo;{query}&rdquo;. Try describing
          more details about the plot, characters, or scenes.
        </p>
      </Card>
    );
  }

  if (matches.length === 1) {
    const m = matches[0];
    return (
      <ShazamCard
        title={m.title}
        tmdbId={m.tmdbId}
        mediaType={m.mediaType}
        year={m.year}
        posterPath={m.posterPath}
        overview={m.overview}
        confidence={m.confidence}
      />
    );
  }

  return (
    <div className="space-y-2 max-w-sm">
      <p className="text-xs text-muted-foreground font-medium">
        Could be one of these:
      </p>
      {matches.map((m) => (
        <ShazamCard
          key={m.tmdbId}
          title={m.title}
          tmdbId={m.tmdbId}
          mediaType={m.mediaType}
          year={m.year}
          posterPath={m.posterPath}
          overview={m.overview}
          confidence={m.confidence}
          showConfidence
        />
      ))}
    </div>
  );
}
