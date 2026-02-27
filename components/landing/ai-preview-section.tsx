"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, MessageSquare, Clapperboard, ChevronRight } from "lucide-react";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
} as const;

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
} as const;

const genrePills = ["Drama", "Romance", "Family", "Classic"];

const steps = [
  {
    icon: MessageSquare,
    title: "Describe your mood",
    description: "Type how you're feeling in plain language — no filters needed.",
  },
  {
    icon: Sparkles,
    title: "AI finds the fit",
    description: "Gemini maps your emotion to genres that truly match your vibe.",
  },
  {
    icon: Clapperboard,
    title: "Browse curated picks",
    description: "Explore handpicked movies and TV shows ready for you to save.",
  },
];

export function AIPreviewSection() {
  const shouldReduceMotion = useReducedMotion();

  const initial = shouldReduceMotion ? "visible" : "hidden";

  return (
    <section className="py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left column: text + steps */}
          <motion.div
            initial={initial}
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
          >
            <motion.p
              variants={fadeUpVariants}
              className="text-sm font-semibold text-accent uppercase tracking-widest mb-4"
            >
              AI-Powered Discovery
            </motion.p>

            <motion.h2
              variants={fadeUpVariants}
              className="text-4xl lg:text-5xl font-bold tracking-tight mb-6 leading-tight"
            >
              Tell us your mood.{" "}
              <span className="text-accent">We&apos;ll find the movie.</span>
            </motion.h2>

            <motion.p
              variants={fadeUpVariants}
              className="text-lg text-muted-foreground mb-10 leading-relaxed"
            >
              No more scrolling through endless lists. Describe how you&apos;re feeling and
              our AI recommends the genres — and movies — that match your moment.
            </motion.p>

            <div className="space-y-6">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    variants={fadeUpVariants}
                    className="flex items-start gap-4"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mt-0.5">
                      <Icon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">{step.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 mt-1 flex-shrink-0 hidden sm:block" />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Right column: mock chat UI */}
          <motion.div
            initial={initial}
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={cardVariants}
            className="relative"
          >
            {/* Glow behind card */}
            <div
              className="absolute -inset-4 rounded-3xl blur-2xl opacity-20 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%, oklch(0.637 0.237 25.331) 0%, transparent 70%)`,
              }}
            />

            {/* Mock chat card */}
            <div className="relative bg-card border border-border rounded-2xl p-6 shadow-2xl">
              {/* Card header */}
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border/60">
                <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                </div>
                <span className="text-sm font-semibold">Moodflix AI</span>
                <div className="ml-auto flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                </div>
              </div>

              {/* User message */}
              <div className="flex justify-end mb-4">
                <div className="bg-accent/15 border border-accent/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                  <p className="text-sm leading-relaxed">
                    I&apos;m feeling nostalgic and want something heartwarming from the past
                  </p>
                </div>
              </div>

              {/* AI response */}
              <div className="flex gap-3 mb-5">
                <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                </div>
                <div className="bg-muted/40 border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                  <p className="text-sm leading-relaxed text-muted-foreground mb-3">
                    That nostalgic, heartwarming feeling calls for these genres —
                  </p>
                  {/* Genre pills */}
                  <div className="flex flex-wrap gap-2">
                    {genrePills.map((genre) => (
                      <span
                        key={genre}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.637 0.237 25.331 / 0.25), oklch(0.637 0.237 25.331 / 0.12))",
                          border: "1px solid oklch(0.637 0.237 25.331 / 0.35)",
                          color: "oklch(0.80 0.10 25)",
                        }}
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Typing indicator / CTA row */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/60">
                <div className="flex-1 bg-background/60 border border-border/60 rounded-xl px-4 py-2.5">
                  <p className="text-sm text-muted-foreground/50 select-none">
                    Describe your mood…
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
