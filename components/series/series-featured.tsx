import Link from "next/link";
import { Play, List } from "lucide-react";
import type { Movie } from "@/types/movie";
import { getBackdropUrl } from "@/lib/utils";

interface SeriesFeaturedProps {
  show: Movie;
}

function splitTail(title: string) {
  const trimmed = title.trim();
  const lastSpace = trimmed.lastIndexOf(" ");
  if (lastSpace < 0) return { head: trimmed, tail: null };
  return {
    head: trimmed.slice(0, lastSpace),
    tail: trimmed.slice(lastSpace + 1),
  };
}

export function SeriesFeatured({ show }: SeriesFeaturedProps) {
  const year = show.release_date?.slice(0, 4);
  const { head, tail } = splitTail(show.title);
  const detailHref = `/tv/${show.id}`;

  return (
    <section className="series-featured reveal">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={getBackdropUrl(show.backdrop_path, "lg")} alt="" />
      <div className="series-featured-body">
        <div className="series-featured-eyebrow">
          <span className="dot" />
          FEATURED SERIES{year ? ` · ${year}` : ""}
        </div>
        <h2 className="series-featured-title">
          {tail ? (
            <>
              {head} <span className="serif-it" style={{ color: "var(--red)" }}>{tail}</span>
            </>
          ) : (
            head
          )}
        </h2>
        {show.overview && (
          <p className="series-featured-desc">{show.overview}</p>
        )}
        <div className="series-featured-actions">
          <Link href={detailHref} className="btn btn-red">
            <Play size={14} fill="currentColor" />
            Start watching
          </Link>
          <Link href={detailHref} className="btn btn-ghost">
            <List size={14} />
            Episodes
          </Link>
        </div>
      </div>
    </section>
  );
}
