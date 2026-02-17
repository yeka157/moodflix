"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="container mx-auto max-w-4xl text-center relative"
      >
        {/* Crimson glow shadow */}
        <div
          className="absolute inset-0 rounded-2xl blur-3xl opacity-20"
          style={{
            background: `radial-gradient(circle at 50% 50%, oklch(0.637 0.237 25.331) 0%, transparent 70%)`,
          }}
        />

        <div className="relative">
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Ready to Find Your Next Favorite Movie?
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join Moodflix today and never struggle to choose what to watch again. Start building
            your personalized library and discover films that truly speak to you.
          </p>

          <Button
            size="lg"
            asChild
            className="text-lg px-12 py-6 h-auto min-h-[56px] bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25"
          >
            <Link href="/signup">Sign Up Free</Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
