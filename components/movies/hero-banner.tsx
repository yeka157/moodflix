"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Play, Plus, Bookmark } from "lucide-react";
import type { Movie } from "@/types/movie";
import { getBackdropUrl } from "@/lib/utils";
import { GENRES } from "@/lib/constants";

interface HeroBannerProps {
  movie: Movie;
  marqueeMovies?: Movie[];
  index?: number;
}

function splitTitle(title: string): { head: string; tail: string | null } {
  const trimmed = title.trim();
  const lastSpace = trimmed.lastIndexOf(" ");
  if (lastSpace < 0) return { head: trimmed, tail: null };
  return {
    head: trimmed.slice(0, lastSpace),
    tail: trimmed.slice(lastSpace + 1),
  };
}

function padIndex(n: number) {
  return String(n).padStart(3, "0");
}

export function HeroBanner({ movie, marqueeMovies = [], index = 1 }: HeroBannerProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const y = window.scrollY;
        const bg = el.querySelector<HTMLImageElement>(".hero-bg img");
        if (bg) {
          bg.style.transform = `translate3d(0, ${y * 0.35}px, 0) scale(1.08)`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const year = movie.release_date?.slice(0, 4) || "—";
  const rating = movie.vote_average?.toFixed(1) ?? "—";
  const displayGenres = (movie.genre_ids ?? [])
    .slice(0, 2)
    .map((id) => GENRES[id])
    .filter(Boolean);

  const { head, tail } = splitTitle(movie.title);
  const detailHref = `/${movie.media_type ?? "movie"}/${movie.id}`;

  return (
    <section className="hero" ref={ref}>
      <div className="hero-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={getBackdropUrl(movie.backdrop_path, "lg")} alt={movie.title} />
      </div>

      <div className="hero-rating">
        <div className="eyebrow mb-2">
          Critics&apos; choice
        </div>
        <div className="num tnum">{rating}</div>
        <div className="label mt-1.5">
          out of 10
        </div>
      </div>

      <div className="hero-content fade-up">
        <div className="hero-meta">
          <span className="pill">NOW SHOWING · {padIndex(index)}</span>
          <span>{year}</span>
          {displayGenres.length > 0 && (
            <>
              <span className="dot" />
              <span>{displayGenres.join(" · ")}</span>
            </>
          )}
        </div>
        <h1 className="hero-title">
          {tail ? (
            <>
              {head}
              <br />
              <span className="it">{tail}</span>
            </>
          ) : (
            head
          )}
        </h1>
        <p className="hero-desc">{movie.overview}</p>
        <div className="hero-actions">
          <Link href={detailHref} className="btn btn-primary btn-lg">
            <Play size={14} fill="currentColor" />
            View details
          </Link>
          <Link href={detailHref} className="btn btn-ghost btn-lg">
            <Plus size={14} />
            Add to library
          </Link>
          <button type="button" className="btn btn-ghost btn-lg">
            <Bookmark size={14} />
            Save for later
          </button>
        </div>
      </div>

      {marqueeMovies.length > 0 && (
        <div className="marquee">
          <div className="marquee-track">
            {[...marqueeMovies, ...marqueeMovies].map((m, i) => (
              <div key={`${m.id}-${i}`} className="marquee-item">
                <span className="star">✦</span>
                <span style={{ color: "var(--ink)" }}>{m.title}</span>
                {m.release_date && (
                  <span style={{ color: "var(--ink-3)" }}>
                    · {m.release_date.slice(0, 4)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
