"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Play,
  Sparkles,
  BookMarked,
  Tv,
  Bell,
  Check,
} from "lucide-react";
import { MoodflixIcon } from "@/components/brand/moodflix-icon";

export type LandingMovie = {
  id: number;
  title: string;
  year: string;
  posterUrl: string;
  backdropUrl: string;
};

interface LandingRevampProps {
  actionHref: string;
  heroBackdropUrl: string;
  finalBackdropUrl: string;
  movies: LandingMovie[];
}

const BTN_BASE =
  "inline-flex items-center gap-2 px-5 py-[11px] rounded-full text-[13px] font-medium tracking-[0.01em] transition-[transform,background-color,color,border-color] duration-200 hover:-translate-y-px active:translate-y-0 active:scale-[0.98] whitespace-nowrap cursor-pointer";
const BTN_RED = "bg-primary text-white hover:bg-[var(--red-deep)]";
const BTN_GHOST =
  "bg-white/[0.06] text-foreground backdrop-blur-md border border-border hover:bg-white/10 hover:border-[var(--line-strong)]";
const BTN_LG = "px-[26px] py-[14px] text-sm";
const EYEBROW =
  "font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground";

function SplitText({ text, baseDelay = 0 }: { text: string; baseDelay?: number }) {
  const words = text.split(" ");
  let charOffset = 0;
  return (
    <>
      {words.map((word, wi) => {
        const wordChars = word.split("");
        const wordSpan = (
          <span className="split-word" key={wi}>
            {wordChars.map((c, ci) => {
              const idx = charOffset + ci;
              return (
                <span className="split" key={ci}>
                  <span style={{ animationDelay: `${baseDelay + idx * 0.025}s` }}>
                    {c}
                  </span>
                </span>
              );
            })}
          </span>
        );
        charOffset += wordChars.length + 1;
        return (
          <span key={wi}>
            {wordSpan}
            {wi < words.length - 1 ? " " : null}
          </span>
        );
      })}
    </>
  );
}

type FloaterProps = {
  movie: LandingMovie;
  pos: { top?: string; bottom?: string; left?: string; right?: string };
  width: number;
  rotate: number;
  delay: number;
};

function FloaterPoster({ movie, pos, width, rotate, delay }: FloaterProps) {
  return (
    <div
      className="lp-floater"
      style={
        {
          ...pos,
          width,
          ["--r" as const]: `${rotate}deg`,
          transform: `rotate(${rotate}deg)`,
          animationDelay: `${delay}s`,
        } as React.CSSProperties
      }
    >
      <img src={movie.posterUrl} alt="" />
    </div>
  );
}

export function LandingRevamp({
  actionHref,
  heroBackdropUrl,
  finalBackdropUrl,
  movies,
}: LandingRevampProps) {
  const heroRef = useRef<HTMLElement | null>(null);
  const galleryRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const vh = window.innerHeight;
        // Hero parallax: transform only the bg image
        if (heroRef.current) {
          const rect = heroRef.current.getBoundingClientRect();
          const total = heroRef.current.offsetHeight - vh;
          const p = Math.max(0, Math.min(1, -rect.top / total));
          const bg = heroRef.current.querySelector<HTMLImageElement>(
            ".lp-hero-bg img",
          );
          if (bg) {
            bg.style.transform = `translate3d(0, ${p * 80}px, 0) scale(${1 + p * 0.15})`;
          }
        }

        // 3D gallery
        if (galleryRef.current) {
          const rect = galleryRef.current.getBoundingClientRect();
          const total = galleryRef.current.offsetHeight - vh;
          const gP = Math.max(0, Math.min(1, -rect.top / total));
          const stage = galleryRef.current.querySelector<HTMLDivElement>(
            ".lp-3d-stage",
          );
          if (stage) {
            const z = -200 + gP * 2600;
            stage.style.transform = `translate3d(0, 0, ${z}px)`;
          }
          const counter = galleryRef.current.querySelector<HTMLDivElement>(
            ".lp-3d-counter",
          );
          if (counter) {
            counter.style.setProperty("--p", String(gP));
            const num = counter.querySelector<HTMLSpanElement>(".num");
            if (num) {
              num.textContent = String(
                Math.min(99, Math.round(gP * 99)),
              ).padStart(2, "0");
            }
          }
          const headlines =
            galleryRef.current.querySelectorAll<HTMLDivElement>(
              ".lp-3d-headline",
            );
          const bands: [number, number, number, number][] = [
            [0.0, 0.1, 0.2, 0.3],
            [0.28, 0.38, 0.52, 0.62],
            [0.6, 0.7, 0.86, 0.96],
          ];
          headlines.forEach((h, i) => {
            const [inS, inE, outS, outE] = bands[i] ?? bands[0];
            let op = 0;
            if (gP < inS) op = 0;
            else if (gP < inE) op = (gP - inS) / (inE - inS);
            else if (gP < outS) op = 1;
            else if (gP < outE) op = 1 - (gP - outS) / (outE - outS);
            else op = 0;
            h.style.opacity = String(op);
            h.style.transform = `translate(-50%, ${-50 + (1 - op) * -8}%)`;
          });
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

  const positions = useMemo(() => {
    const out: { x: number; y: number; z: number; rotY: number }[] = [];
    const rows = 6;
    const colsPerRow = 4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < colsPerRow; c++) {
        const i = r * colsPerRow + c;
        const seed = (i * 37) % 100;
        const xJ = ((seed % 17) - 8) * 0.7;
        const yJ = (((seed * 3) % 13) - 6) * 0.6;
        const x = -55 + (c / (colsPerRow - 1)) * 110 + xJ;
        const y = -32 + (r % 2 === 0 ? -10 : 10) + yJ;
        const z = -2400 + r * 480 + ((i * 13) % 200);
        const rotY = ((i % 5) - 2) * 4;
        out.push({ x, y, z, rotY });
      }
    }
    return out;
  }, []);

  const floaters = movies.slice(0, 4);
  const galleryMovies = movies.length > 0 ? movies : [];

  return (
    <div className="landing-page page">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-3 sm:px-6 md:px-14 pt-3 md:pt-4 flex justify-center pointer-events-none">
        <div className="flex items-center justify-between w-full max-w-[1440px] gap-2 py-2 md:py-2.5 pl-3 pr-2 md:pl-[22px] md:pr-4 rounded-full bg-[rgba(20,17,15,0.65)] backdrop-blur-[18px] backdrop-saturate-[1.4] border border-border pointer-events-auto">
          <Link
            href="/"
            aria-label="Moodflix home"
            className="flex items-center gap-2 no-underline shrink-0"
          >
            <MoodflixIcon size={28} variant="dark" cutoutColor="#14110f" className="md:hidden" />
            <MoodflixIcon size={32} variant="dark" cutoutColor="#14110f" className="hidden md:block" />
            <span className="font-display uppercase tracking-[0.04em] text-[18px] md:text-[22px] text-foreground leading-none">
              oodflix
            </span>
          </Link>
          <div className="hidden md:flex gap-7">
            <a className="text-[13.5px] text-[var(--ink-2)] hover:text-foreground transition-colors cursor-pointer no-underline" href="#features">
              Features
            </a>
            <a className="text-[13.5px] text-[var(--ink-2)] hover:text-foreground transition-colors cursor-pointer no-underline" href="#how">
              How it works
            </a>
            <a className="text-[13.5px] text-[var(--ink-2)] hover:text-foreground transition-colors cursor-pointer no-underline" href="#pricing">
              Pricing
            </a>
            <a className="text-[13.5px] text-[var(--ink-2)] hover:text-foreground transition-colors cursor-pointer no-underline" href="#manifesto">
              Manifesto
            </a>
          </div>
          <div className="flex gap-1.5 md:gap-2 shrink-0">
            <Link href={actionHref} className={`${BTN_BASE} ${BTN_GHOST} px-3 md:px-5 text-[12px] md:text-[13px]`}>
              Sign in
            </Link>
            <Link href={actionHref} className={`${BTN_BASE} ${BTN_RED} px-3 md:px-5 text-[12px] md:text-[13px]`}>
              Start free
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO — pinned scroll */}
      <section className="lp-hero" ref={heroRef}>
        <div className="lp-hero-stick">
          <div className="lp-hero-bg">
            <img src={heroBackdropUrl} alt="" />
          </div>

          <div className="lp-floaters">
            {floaters[0] && (
              <FloaterPoster
                movie={floaters[0]}
                pos={{ top: "12%", left: "6%" }}
                width={130}
                rotate={-6}
                delay={0}
              />
            )}
            {floaters[1] && (
              <FloaterPoster
                movie={floaters[1]}
                pos={{ top: "22%", right: "8%" }}
                width={140}
                rotate={8}
                delay={0.1}
              />
            )}
            {floaters[2] && (
              <FloaterPoster
                movie={floaters[2]}
                pos={{ bottom: "18%", left: "10%" }}
                width={120}
                rotate={4}
                delay={0.2}
              />
            )}
            {floaters[3] && (
              <FloaterPoster
                movie={floaters[3]}
                pos={{ bottom: "24%", right: "6%" }}
                width={150}
                rotate={-10}
                delay={0.3}
              />
            )}
          </div>

          <div className="relative z-[2] text-center max-w-[880px] px-8 will-change-[transform,opacity]">
            <div className="lp-badge inline-flex items-center gap-2 px-3.5 py-[7px] rounded-full border border-primary bg-[var(--red-soft)] text-primary font-mono text-[11px] uppercase tracking-[0.1em] mb-8">
              <span className="pulse" />
              AI-powered mood discovery
            </div>

            <h1 className="lp-hero-title">
              <SplitText text="Movies that" baseDelay={0.2} />
              <br />
              <SplitText text="match your " baseDelay={0.6} />
              <span className="split">
                <span
                  className="serif-it"
                  style={{ animationDelay: "0.95s" }}
                >
                  mood.
                </span>
              </span>
            </h1>

            <p className="text-lg leading-[1.55] text-[var(--ink-2)] max-w-[580px] mx-auto mb-9">
              Tell us how you feel — slow Sunday, raining outside, can&apos;t
              sleep — and we&apos;ll pull the films and series that fit. Built
              for people who want fewer, better picks.
            </p>

            <div className="flex gap-3 justify-center mb-14 flex-wrap">
              <Link href={actionHref} className={`${BTN_BASE} ${BTN_RED} ${BTN_LG}`}>
                Start watching, free
                <ArrowRight size={14} />
              </Link>
              <a className={`${BTN_BASE} ${BTN_GHOST} ${BTN_LG}`}>
                <Play size={12} />
                Watch the 90-sec tour
              </a>
            </div>

            <div className="inline-flex items-center gap-4 px-[18px] py-2.5 rounded-full border border-border bg-[rgba(20,17,15,0.5)] backdrop-blur-[12px]">
              <div className="flex">
                {[14, 32, 47, 5, 12].map((n) => (
                  <div
                    key={n}
                    className="w-7 h-7 rounded-full bg-cover bg-center -ml-2 first:ml-0 border-2 border-background"
                    style={{
                      backgroundImage: `url(https://i.pravatar.cc/80?img=${n})`,
                    }}
                  />
                ))}
              </div>
              <div>
                <div className="font-mono text-xs">
                  ★ 4.9 · 12,400+ film lovers
                </div>
                <div className={EYEBROW}>JOINED IN THE LAST WEEK</div>
              </div>
            </div>
          </div>

          <div className="lp-scroll-cue">
            <span className={EYEBROW}>SCROLL</span>
            <div className="line" />
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee" style={{ borderRadius: 0 }}>
        <div className="marquee-track">
          {[...movies, ...movies].map((m, i) => (
            <div key={`${m.id}-${i}`} className="marquee-item">
              <span className="star">✦</span>
              <span className="text-foreground">{m.title}</span>
              <span className="text-muted-foreground">— {m.year}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MOOD AI DEMO */}
      <section className="px-5 sm:px-8 md:px-14 py-16 md:py-[120px] max-w-[1440px] mx-auto" id="how">
        <SectionEyebrow label="HOW IT FEELS" />
        <h2 className="font-display uppercase text-[clamp(56px,8vw,112px)] leading-[0.88] tracking-[0.002em] m-0 mb-6" data-lp-reveal>
          Type a feeling.
          <br />
          We do the{" "}
          <span className="font-serif italic normal-case tracking-[-0.015em] text-[var(--ink-2)]">
            rest.
          </span>
        </h2>
        <p className="text-[19px] text-[var(--ink-2)] leading-[1.55] max-w-[640px] mt-0 mb-12" data-lp-reveal>
          Our AI reads tone, not keywords. Speak naturally — the way you&apos;d
          describe a movie to a friend you trust.
        </p>

        <MoodDemoCard movies={movies} />
      </section>

      {/* 3D POSTER GALLERY */}
      <section className="lp-3d" ref={galleryRef}>
        <div className="lp-3d-stick">
          <div className="lp-3d-counter">
            <span>FILM</span>
            <span className="num">00</span>
            <span className="bar" />
            <span>OF 80,000</span>
          </div>

          <div className="lp-3d-headline">
            <div className="inline-flex items-center justify-center font-mono text-[11px] text-muted-foreground tracking-[0.14em] uppercase mb-6">
              <span>CATALOG</span>
            </div>
            <h2>
              Eighty thousand films,
              <br />
              one library that{" "}
              <span className="serif-it">listens.</span>
            </h2>
            <p>
              Films, series, K-drama, documentaries, festival picks — re-ranked
              by your taste.
            </p>
          </div>

          <div className="lp-3d-headline">
            <h2>
              <span className="serif-it">Curated</span>,
              <br />
              never algorithmic.
            </h2>
            <p>
              We pick five films at a time and tell you why. Less scrolling,
              more watching.
            </p>
          </div>

          <div className="lp-3d-headline">
            <h2>
              Your library,
              <br />
              <span className="serif-it">forever.</span>
            </h2>
            <p style={{ marginBottom: 24 }}>
              Free to start. Take your data with you. Cancel any time.
            </p>
            <Link
              href={actionHref}
              className={`${BTN_BASE} ${BTN_RED} ${BTN_LG} pointer-events-auto`}
            >
              Enter moodflix
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="lp-3d-stage">
            {positions.map((p, i) => {
              const m = galleryMovies[i % Math.max(galleryMovies.length, 1)];
              if (!m) return null;
              return (
                <div
                  key={i}
                  className="lp-3d-poster"
                  style={{
                    left: `calc(50% + ${p.x}vw)`,
                    top: `calc(50% + ${p.y}vh)`,
                    marginLeft: -100,
                    marginTop: -150,
                    transform: `translate3d(0, 0, ${p.z}px) rotateY(${p.rotY}deg)`,
                  }}
                >
                  <img src={m.posterUrl} alt={m.title} loading="lazy" />
                  <div className="meta">
                    {m.title}
                    <div className="sub">{m.year}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lp-3d-vignette" />
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-5 sm:px-8 md:px-14 py-16 md:py-[120px] max-w-[1440px] mx-auto" id="features">
        <SectionEyebrow label="WHAT YOU GET" />
        <h2 className="font-display uppercase text-[clamp(56px,8vw,112px)] leading-[0.88] tracking-[0.002em] m-0 mb-6" data-lp-reveal>
          Everything a{" "}
          <span className="font-serif italic normal-case tracking-[-0.015em] text-[var(--ink-2)]">
            film lover
          </span>
          <br />
          actually wants.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-14">
          <FeatureCard
            num="01"
            title="AI mood discovery"
            desc="Describe how you're feeling. Get five films, each with a sentence on why it fits. No genres to wade through."
            icon={<Sparkles size={20} />}
          />
          <FeatureCard
            num="02"
            title="A library that's yours"
            desc="Want to watch, watching, watched. Personal ratings, private notes, no algorithm pushing the obvious."
            icon={<BookMarked size={20} />}
          />
          <FeatureCard
            num="03"
            title="Where to watch — instantly"
            desc="Stream, rent, or buy. We surface availability across Netflix, Mubi, Criterion, Prime — region-aware."
            icon={<Tv size={20} />}
          />
          <FeatureCard
            num="04"
            title="Series, in long-form"
            desc="K-drama, C-drama, prestige TV, festival miniseries. Track season-by-season with no fuss."
            icon={<Play size={20} />}
          />
          <FeatureCard
            num="05"
            title="Notify on releases"
            desc="When something you've waited for drops anywhere, we tell you. Once. Quietly."
            icon={<Bell size={20} />}
          />
          <FeatureCard
            num="06"
            title="Free forever"
            desc="No ads, no upsell to a subscription tier. Pay $4/mo if you want extras. Otherwise, just enjoy."
            icon={<Check size={20} />}
          />
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="px-5 sm:px-8 md:px-14 py-20 md:py-40 text-center border-y border-border" id="manifesto">
        <div className="inline-flex items-center justify-center font-mono text-[11px] text-muted-foreground tracking-[0.14em] uppercase mb-6" data-lp-reveal>
          <span>MANIFESTO</span>
        </div>
        <h2 className="font-display uppercase text-[clamp(40px,4.4vw,64px)] leading-[1.05] tracking-[0.002em] max-w-[1100px] mx-auto text-balance" data-lp-reveal>
          We made{" "}
          <span className="font-serif italic normal-case tracking-[-0.02em] text-primary">
            moodflix
          </span>{" "}
          because film
          <br />
          discovery has been broken for a decade.
          <br />
          <span className="text-muted-foreground">
            Algorithms optimized for time-on-app, not feeling. Catalogs that
            surface
            <br />
            the same six titles. Endless scrolling that ends with nothing
            chosen.
          </span>
          <br />
          <br />
          We&apos;re{" "}
          <span className="font-serif italic normal-case tracking-[-0.02em] text-primary">
            small,
          </span>{" "}
          we read every email, and we
          <br />
          care more about the next great Sunday afternoon you have
          <br />
          than the size of our quarterly metrics.
        </h2>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-5 sm:px-8 md:px-14 py-16 md:py-[120px] max-w-[1440px] mx-auto">
        <SectionEyebrow label="WHAT PEOPLE SAY" />
        <h2 className="font-display uppercase text-[clamp(56px,8vw,112px)] leading-[0.88] tracking-[0.002em] m-0 mb-6" data-lp-reveal>
          From the people
          <br />
          who{" "}
          <span className="font-serif italic normal-case tracking-[-0.015em] text-[var(--ink-2)]">
            use it.
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] mt-14">
          <Testimonial
            q="I cancelled my Letterboxd Pro the same week I found moodflix. The AI picks felt like a friend who actually knows me."
            name="Sara Lee"
            handle="@saralike"
            av={32}
          />
          <Testimonial
            q="The mood input is a real product, not a gimmick. I asked for 'wedding cancelled, need to feel okay,' and it gave me Junebloom. Did not know I needed Junebloom."
            name="Adi Mehta"
            handle="@adimoves"
            av={47}
          />
          <Testimonial
            q="The interface alone is worth opening every day. It just feels nice."
            name="Mae Castellanos"
            handle="@maeshot"
            av={5}
          />
          <Testimonial
            q="Finally a film tracker that doesn't try to be a social network."
            name="Felix Roy"
            handle="@feliix"
            av={14}
          />
        </div>
      </section>

      {/* PRICING */}
      <section className="px-5 sm:px-8 md:px-14 py-16 md:py-[120px] max-w-[1440px] mx-auto" id="pricing">
        <SectionEyebrow label="PRICING" />
        <h2 className="font-display uppercase text-[clamp(56px,8vw,112px)] leading-[0.88] tracking-[0.002em] m-0 mb-6" data-lp-reveal>
          Two plans. Both{" "}
          <span className="font-serif italic normal-case tracking-[-0.015em] text-[var(--ink-2)]">
            honest.
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] max-w-[880px] mt-14">
          <PriceCard
            name="Free"
            price="$0"
            unit="forever"
            features={[
              "Unlimited library",
              "10 AI picks / day",
              "Where-to-watch",
              "Release alerts",
            ]}
            cta="Start free"
            href={actionHref}
          />
          <PriceCard
            name="Critic"
            price="$4"
            unit="per month"
            features={[
              "Everything in Free",
              "Unlimited AI picks",
              "Mood journal & history",
              "Export your data",
              "Early access features",
            ]}
            cta="Try 14 days free"
            href={actionHref}
            featured
          />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="lp-final relative px-14 py-40 text-center overflow-hidden">
        <div className="lp-final-bg">
          <img src={finalBackdropUrl} alt="" />
        </div>
        <div className="relative z-[2] max-w-[720px] mx-auto" data-lp-reveal>
          <h2 className="font-display uppercase text-[clamp(64px,10vw,144px)] leading-[0.85] tracking-[0.002em] mb-7">
            Your next
            <br />
            <span className="font-serif italic normal-case tracking-[-0.015em] text-primary">
              favorite film
            </span>
            <br />
            is waiting.
          </h2>
          <p className="text-[19px] text-[var(--ink-2)] leading-[1.55] max-w-[640px] mx-auto mt-0 mb-7">
            Free to start. No card. Cancel any time, take your library with
            you.
          </p>
          <Link href={actionHref} className={`${BTN_BASE} ${BTN_RED} ${BTN_LG}`}>
            Enter moodflix
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-card border-t border-border">
        <div className="lp-footer-inner">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MoodflixIcon size={28} variant="dark" cutoutColor="#14110f" />
              <span className="font-display uppercase tracking-[0.04em] text-[22px] text-foreground leading-none">
                oodflix
              </span>
            </div>
            <p className="text-[var(--ink-3)] text-[13px] max-w-[280px] leading-[1.6] m-0">
              A movie tracker that listens. Made by two people in two cities,
              for everyone who watches.
            </p>
          </div>
          <FooterCol
            title="Product"
            items={[
              { label: "Discover", href: "/discover" },
              { label: "Library", href: "/library" },
              { label: "Series", href: "/series" },
            ]}
          />
          <FooterCol
            title="Company"
            items={[
              { label: "Manifesto", href: "#manifesto" },
              { label: "Contact", href: "mailto:hello@yuliuskevin.com" },
            ]}
          />
          <FooterCol
            title="Legal"
            items={[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
            ]}
          />
        </div>
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 md:px-14 py-6 border-t border-border flex justify-between flex-wrap gap-3">
          <div className="font-mono text-[11px] text-[var(--ink-3)]">
            © 2026 moodflix labs · v2.0 · made with film and patience
          </div>
          <div className="font-mono text-[11px] text-[var(--ink-3)]">
            TMDB DATA POWERS THE REAL APP
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionEyebrow({ label }: { label: string }) {
  return (
    <div
      className="inline-flex items-center font-mono text-[11px] text-muted-foreground tracking-[0.14em] uppercase mb-6"
      data-lp-reveal
    >
      <span>{label}</span>
    </div>
  );
}

function MoodDemoCard({ movies }: { movies: LandingMovie[] }) {
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState("");
  const example = "Just got home, raining, want something quiet.";

  useEffect(() => {
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      i++;
      if (i <= example.length) {
        setTyped(example.slice(0, i));
        timer = setTimeout(tick, 36);
      } else {
        timer = setTimeout(() => setStep(1), 600);
      }
    };
    timer = setTimeout(tick, 800);
    return () => clearTimeout(timer);
  }, []);

  const picks = movies.slice(3, 7);
  const sentences = [
    "Slow, careful, exactly the kind of patient film for a rainy evening.",
    "A small story told quietly. Sit with this one.",
    "No big swings — just texture, light, and time.",
    "Reads beautifully on second screen, plays even better on first.",
  ];

  return (
    <div
      className="lp-demo"
      data-lp-reveal
    >
      <div className="bg-card border border-[var(--line-strong)] rounded-[20px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3.5 px-4 py-3 bg-muted border-b border-border">
          <div className="flex gap-1.5">
            <span className="w-[11px] h-[11px] rounded-full bg-[#ff5f57]" />
            <span className="w-[11px] h-[11px] rounded-full bg-[#ffbd2e]" />
            <span className="w-[11px] h-[11px] rounded-full bg-[#27c93f]" />
          </div>
          <div className="flex-1 text-center text-xs text-muted-foreground font-mono">
            moodflix.app/mood
          </div>
        </div>
        <div className="p-8">
          <div className="flex items-center gap-2.5 px-5 py-[18px] bg-background border border-primary rounded-[14px] text-base mb-6 text-foreground">
            <Sparkles size={14} />
            <span>
              {typed || "Type a feeling…"}
              <span className="lp-cursor">|</span>
            </span>
          </div>

          {step >= 1 && (
            <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground mb-5">
              <div className="lp-think-dots">
                <span />
                <span />
                <span />
              </div>
              moodflix is reading the room…
            </div>
          )}

          {step >= 1 && (
            <div className="flex flex-col gap-3.5">
              {picks.map((m, i) => (
                <div
                  key={m.id}
                  className="lp-demo-pick"
                  style={{ animationDelay: `${1 + i * 0.12}s` }}
                >
                  <img src={m.posterUrl} alt="" />
                  <div>
                    <div className="text-sm font-medium mb-1">{m.title}</div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={EYEBROW}>{m.year} · drama</span>
                      <span className="font-mono text-[11px] text-[var(--ink-3)]">★ 8.4</span>
                    </div>
                    <p className="text-xs text-[var(--ink-2)] leading-[1.5] m-0">
                      {sentences[i]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pt-8">
        <div className={`${EYEBROW} text-primary`}>● LIVE DEMO</div>
        <h3 className="font-display uppercase text-[36px] leading-[0.95] tracking-[0.005em] mt-3 mb-4">
          Five picks.
          <br />
          One sentence each.
        </h3>
        <p className="text-[var(--ink-2)] text-sm leading-[1.6] m-0">
          Not a list of 200. Not a row of &quot;popular.&quot; We pick five
          films we believe in, and we tell you why — in language you can argue
          with.
        </p>
        <div className="flex gap-8 mt-8 pt-6 border-t border-border">
          <div>
            <div className="font-display text-[44px] leading-[0.9] text-foreground">
              2.4s
            </div>
            <div className={EYEBROW}>AVG RESPONSE</div>
          </div>
          <div>
            <div className="font-display text-[44px] leading-[0.9] text-foreground">
              97%
            </div>
            <div className={EYEBROW}>RELEVANCE</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  num,
  title,
  desc,
  icon,
}: {
  num: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col p-8 bg-card border border-border rounded-[20px] transition-[border-color,transform] duration-300 hover:border-[var(--line-strong)] hover:-translate-y-1 min-h-[240px]"
      data-lp-reveal
    >
      <div className="flex justify-between items-center mb-8">
        <div className="grid place-items-center w-11 h-11 rounded-xl bg-[var(--red-soft)] text-primary">
          {icon}
        </div>
        <div className="text-[11px] text-muted-foreground tracking-[0.1em] font-mono">
          {num}
        </div>
      </div>
      <h3 className="font-display uppercase text-[28px] leading-none m-0 mb-3.5">
        {title}
      </h3>
      <p className="text-sm text-[var(--ink-2)] leading-[1.55] m-0">{desc}</p>
    </div>
  );
}

function Testimonial({
  q,
  name,
  handle,
  av,
}: {
  q: string;
  name: string;
  handle: string;
  av: number;
}) {
  return (
    <div
      className="relative p-7 bg-card border border-border rounded-[20px]"
      data-lp-reveal
    >
      <div className="absolute top-4 right-6 font-serif italic text-[88px] leading-[0.6] text-primary opacity-60">
        &ldquo;
      </div>
      <p className="font-serif italic text-[22px] leading-[1.4] text-foreground m-0 mb-6 pr-10">
        {q}
      </p>
      <div className="flex gap-3 items-center">
        <div
          className="w-9 h-9 rounded-full bg-cover bg-center"
          style={{
            backgroundImage: `url(https://i.pravatar.cc/80?img=${av})`,
          }}
        />
        <div>
          <div className="font-medium text-[13px]">{name}</div>
          <div className="font-mono text-[11px] text-[var(--ink-3)]">
            {handle}
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceCard({
  name,
  price,
  unit,
  features,
  cta,
  href,
  featured,
}: {
  name: string;
  price: string;
  unit: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col p-8 bg-card border rounded-[28px] min-h-[480px] ${
        featured
          ? "bg-[linear-gradient(180deg,rgba(255,59,63,0.08),transparent_50%)] border-primary"
          : "border-border"
      }`}
      data-lp-reveal
    >
      {featured && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-white font-mono text-[10px] px-3 py-[5px] rounded-full tracking-[0.1em]">
          RECOMMENDED
        </div>
      )}
      <div className={EYEBROW}>{name.toUpperCase()}</div>
      <div className="flex items-baseline gap-2 mt-4 mb-8">
        <span className="font-display text-[88px] leading-[0.85]">{price}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      <ul className="list-none p-0 mb-8 flex flex-col gap-3.5 flex-1">
        {features.map((f) => (
          <li
            key={f}
            className="flex items-center gap-2.5 text-sm text-[var(--ink-2)]"
          >
            <Check size={14} className="text-primary shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`${BTN_BASE} ${featured ? BTN_RED : BTN_GHOST} ${BTN_LG} w-full justify-center mt-auto`}
      >
        {cta}
        <ArrowRight size={12} />
      </Link>
    </div>
  );
}

type FooterItem = string | { label: string; href: string };

function FooterCol({ title, items }: { title: string; items: FooterItem[] }) {
  return (
    <div>
      <div className={`${EYEBROW} mb-3`}>{title}</div>
      <ul className="list-none p-0 m-0 flex flex-col gap-2">
        {items.map((item) => {
          const label = typeof item === "string" ? item : item.label;
          const href = typeof item === "string" ? undefined : item.href;
          const className =
            "text-[13px] text-[var(--ink-2)] cursor-pointer no-underline hover:text-foreground transition-colors";
          if (!href) {
            return (
              <li key={label}>
                <a className={className}>{label}</a>
              </li>
            );
          }
          const isInternal = href.startsWith("/");
          return (
            <li key={label}>
              {isInternal ? (
                <Link href={href} className={className}>
                  {label}
                </Link>
              ) : (
                <a href={href} className={className}>
                  {label}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
