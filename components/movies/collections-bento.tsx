import Link from "next/link";
import { getBackdropUrl } from "@/lib/utils";
import type { Movie } from "@/types/movie";
import { SectionHeader } from "@/components/layout/section-header";
import { ArrowUpRight } from "lucide-react";

interface CollectionsBentoProps {
  sourceMovies: Movie[];
}

type Cell = {
  size: "huge" | "wide" | "default";
  title: string;
  caption: string;
  href: string;
};

const CELLS: Cell[] = [
  {
    size: "huge",
    title: "Films that move you",
    caption: "EDITORIAL · DRAMA",
    href: "/discover",
  },
  {
    size: "default",
    title: "After-hours thrills",
    caption: "THRILLER · MYSTERY",
    href: "/discover",
  },
  {
    size: "default",
    title: "Lights off, sound on",
    caption: "HORROR · GENRE",
    href: "/discover",
  },
  {
    size: "wide",
    title: "Quiet revolutions",
    caption: "DOCUMENTARY · INDIE",
    href: "/discover",
  },
];

export function CollectionsBento({ sourceMovies }: CollectionsBentoProps) {
  const backdrops = sourceMovies
    .filter((m) => m.backdrop_path)
    .slice(0, CELLS.length);
  if (backdrops.length < CELLS.length) return null;

  return (
    <section className="section reveal" style={{ paddingTop: 24 }}>
      <SectionHeader
        eyebrowLabel="CURATED"
        title={
          <>
            Collections, by <span className="it">mood</span>
          </>
        }
        rightSlot={
          <Link
            href="/discover"
            className="btn btn-ghost"
            style={{ marginRight: 4 }}
          >
            All collections
            <ArrowUpRight size={12} />
          </Link>
        }
      />
      <div className="bento">
        {CELLS.map((cell, i) => {
          const movie = backdrops[i];
          return (
            <Link
              key={cell.title}
              href={cell.href}
              className={`bento-cell ${cell.size === "huge" ? "huge" : cell.size === "wide" ? "wide" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getBackdropUrl(movie.backdrop_path, "lg")}
                alt=""
                loading="lazy"
              />
              <div className="info">
                <div className="s">{cell.caption}</div>
                <div className="t">{cell.title}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
