"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  backdropUrl: string | null;
}

export function HeroSection({ backdropUrl }: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const backdropY = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? ["0%", "0%"] : ["0%", "25%"],
  );

  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.6],
    shouldReduceMotion ? [1, 1] : [1, 0],
  );

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen overflow-hidden flex items-center"
    >
      {/* Parallax backdrop layer */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y: backdropY }}
      >
        {backdropUrl ? (
          <>
            <Image
              src={backdropUrl}
              alt="Featured movie backdrop"
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
            {/* Bottom gradient — fades to page background */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, oklch(0.13 0.008 25) 0%, oklch(0.13 0.008 25 / 0.7) 40%, oklch(0.13 0.008 25 / 0.2) 100%)",
              }}
            />
            {/* Left vignette */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, oklch(0.13 0.008 25 / 0.9) 0%, oklch(0.13 0.008 25 / 0.4) 50%, transparent 100%)",
              }}
            />
          </>
        ) : (
          /* Fallback solid dark background */
          <div className="absolute inset-0 bg-[oklch(0.11_0.008_25)]">
            {/* Crimson radial glow as fallback accent */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 40% 50%, oklch(0.637 0.237 25.331 / 0.12) 0%, transparent 60%)",
              }}
            />
          </div>
        )}
      </motion.div>

      {/* Content layer */}
      <motion.div
        className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-16"
        style={{ opacity: contentOpacity }}
      >
        {/* Left: text content */}
        <div className="flex-1 text-left max-w-xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
            style={{
              background: "oklch(0.637 0.237 25.331 / 0.15)",
              border: "1px solid oklch(0.637 0.237 25.331 / 0.3)",
              color: "oklch(0.75 0.15 25.331)",
            }}
          >
            <Sparkles className="w-4 h-4" />
            AI-Powered Movie Discovery
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6 leading-[1.08]"
          >
            Discover movies that match your{" "}
            <span style={{ color: "oklch(0.637 0.237 25.331)" }}>mood</span>
          </motion.h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-lg lg:text-xl text-muted-foreground mb-10 leading-relaxed max-w-lg"
          >
            Tell our AI how you&apos;re feeling and get personalized movie recommendations
            instantly. Build your library, track what you&apos;ve watched, and never miss
            a great film.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              size="lg"
              asChild
              className="text-base px-8 min-h-[44px] font-semibold"
            >
              <Link href="/signup">Get Started Free</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="text-base px-8 min-h-[44px] bg-background/20 border-white/20 hover:bg-background/40 backdrop-blur-sm"
            >
              <Link href="#features">Learn More</Link>
            </Button>
          </motion.div>
        </div>

        {/* Right: App screenshot placeholder */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex-1 w-full max-w-lg lg:max-w-none"
        >
          {/* Browser frame mockup */}
          <div
            className="relative rounded-xl overflow-hidden shadow-2xl"
            style={{
              border: "1px solid oklch(1 0 0 / 0.12)",
              background: "oklch(0.11 0.008 25)",
            }}
          >
            {/* Browser chrome bar */}
            <div
              className="flex items-center gap-2 px-4 py-3 border-b"
              style={{
                background: "oklch(0.15 0.008 25)",
                borderColor: "oklch(1 0 0 / 0.08)",
              }}
            >
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div
                className="flex-1 mx-4 h-6 rounded-md flex items-center justify-center"
                style={{ background: "oklch(0.18 0.008 25)" }}
              >
                <span className="text-xs text-muted-foreground">moodflix.app/home</span>
              </div>
            </div>

            {/* App screenshot area */}
            {/* TODO: Replace with real screenshot after capture */}
            <div
              className="aspect-video relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.13 0.008 25) 0%, oklch(0.16 0.012 25) 50%, oklch(0.13 0.008 25) 100%)",
              }}
            >
              {/* Simulated app content */}
              <div className="absolute inset-0 p-4">
                {/* Top bar */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="h-5 w-24 rounded"
                    style={{ background: "oklch(0.637 0.237 25.331 / 0.4)" }}
                  />
                  <div className="flex gap-2">
                    <div
                      className="h-5 w-16 rounded"
                      style={{ background: "oklch(1 0 0 / 0.08)" }}
                    />
                    <div
                      className="h-5 w-16 rounded"
                      style={{ background: "oklch(1 0 0 / 0.08)" }}
                    />
                  </div>
                </div>
                {/* Movie grid placeholder */}
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[2/3] rounded-lg"
                      style={{
                        background: `oklch(${0.18 + (i % 3) * 0.04} 0.008 25)`,
                        opacity: 0.7 + (i % 4) * 0.075,
                      }}
                    />
                  ))}
                </div>
                {/* AI prompt bar at bottom */}
                <div
                  className="absolute bottom-4 left-4 right-4 h-10 rounded-lg flex items-center px-4"
                  style={{
                    background: "oklch(0.18 0.012 25)",
                    border: "1px solid oklch(0.637 0.237 25.331 / 0.3)",
                  }}
                >
                  <span className="text-xs text-muted-foreground">
                    How are you feeling today?
                  </span>
                  <div
                    className="ml-auto w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ background: "oklch(0.637 0.237 25.331)" }}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>

              {/* Subtle grid overlay */}
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />
            </div>
          </div>

          {/* Glow under the screenshot */}
          <div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 blur-2xl opacity-30 pointer-events-none"
            style={{ background: "oklch(0.637 0.237 25.331)" }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
