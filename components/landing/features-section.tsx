"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Film, BookmarkCheck, Tv } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI Mood Discovery",
    description:
      "Describe how you're feeling and our AI will recommend movies that perfectly match your current mood — no more endless scrolling.",
  },
  {
    icon: Film,
    title: "Movie & TV Browse",
    description:
      "Explore thousands of titles with TMDB-powered discovery. Filter by genre, sort by popularity, and infinite-scroll through results.",
  },
  {
    icon: BookmarkCheck,
    title: "Personal Library",
    description:
      "Track what you want to watch and what you've seen. Instant status updates and like/dislike ratings keep your collection organized.",
  },
  {
    icon: Tv,
    title: "TV Series",
    description:
      "Discover Korean and Chinese dramas alongside Hollywood hits. Dive into series detail pages with episode counts and cast info.",
  },
] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
} as const;

const headingVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
} as const;

export function FeaturesSection() {
  const shouldReduceMotion = useReducedMotion();
  const animationInitial = shouldReduceMotion ? "visible" : "hidden";

  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section heading */}
        <motion.div
          variants={headingVariants}
          initial={animationInitial}
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From AI-powered mood matching to your personal film library — all in
            one cinematic experience.
          </p>
        </motion.div>

        {/* Feature cards grid */}
        <motion.div
          variants={containerVariants}
          initial={animationInitial}
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                className="bg-card/50 border border-border/50 rounded-2xl p-6 hover:border-accent/30 transition-colors duration-300"
              >
                <div className="bg-accent/10 text-accent rounded-xl w-12 h-12 flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
