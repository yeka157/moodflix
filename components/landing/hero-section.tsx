"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoodflixLogo } from "@/components/brand/moodflix-logo";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Crimson radial gradient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 40%, oklch(0.637 0.237 25.331 / 0.15) 0%, transparent 60%)`,
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Logo — above the badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <MoodflixLogo height={48} variant="dark" showTagline={false} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <Badge
            variant="secondary"
            className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Movie Discovery
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent"
        >
          Discover Movies That Match Your Mood
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
        >
          Let AI understand your feelings and recommend the perfect movies. Build your personal
          library, track what you&apos;ve seen, and never run out of great films to watch.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button size="lg" asChild className="text-base px-8 min-h-[44px]">
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="text-base px-8 min-h-[44px]">
            <Link href="#features">Learn More</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
