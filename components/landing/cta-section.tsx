"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
} as const;

const fadeUpVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
} as const;

const trustSignals = [
  "No credit card required",
  "Free forever plan",
  "Cancel anytime",
];

export function CTASection({ actionHref }: { actionHref: string }) {
  const shouldReduceMotion = useReducedMotion();
  const initial = shouldReduceMotion ? "visible" : "hidden";

  return (
    <section className="py-24 px-4">
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={initial}
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
          className="relative text-center"
        >
          {/* Radial glow */}
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 60%, oklch(0.637 0.237 25.331 / 0.08) 0%, transparent 70%)",
            }}
          />

          {/* Bordered card */}
          <div className="relative bg-card/30 border border-border/60 rounded-3xl px-8 py-16 sm:px-16">
            <motion.p
              variants={fadeUpVariants}
              className="text-sm font-semibold text-accent uppercase tracking-widest mb-5"
            >
              Get Started Today
            </motion.p>

            <motion.h2
              variants={fadeUpVariants}
              className="text-4xl lg:text-5xl font-bold tracking-tight mb-5 leading-tight"
            >
              Ready to discover your next{" "}
              <span className="text-accent">favorite movie?</span>
            </motion.h2>

            <motion.p
              variants={fadeUpVariants}
              className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed"
            >
              Join Moodflix and let AI match movies to your mood. Build your personal
              library, track what you&apos;ve watched, and never waste time choosing again.
            </motion.p>

            <motion.div variants={fadeUpVariants}>
              <Link
                href={actionHref}
                className="inline-flex items-center gap-2 text-base font-semibold px-10 py-4 rounded-xl min-h-[52px] transition-all duration-200 hover:opacity-90 hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.637 0.237 25.331), oklch(0.55 0.20 25))",
                  color: "white",
                  boxShadow: "0 4px 24px oklch(0.637 0.237 25.331 / 0.3)",
                }}
              >
                Get Started — It&apos;s Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              variants={fadeUpVariants}
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6"
            >
              {trustSignals.map((signal) => (
                <span
                  key={signal}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-accent/70 flex-shrink-0" />
                  {signal}
                </span>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
