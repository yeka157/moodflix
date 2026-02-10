"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const moodChips = ["Happy", "Sad", "Thrilling", "Cozy", "Romantic"];

export function AIPreviewSection() {
  return (
    <section className="py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Mock mood input card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* Purple glow */}
            <div
              className="absolute inset-0 rounded-2xl blur-3xl opacity-30"
              style={{
                background: `radial-gradient(circle at 50% 50%, oklch(0.541 0.238 293.541) 0%, transparent 70%)`,
              }}
            />

            <div className="relative bg-card border border-border rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Describe Your Mood</h3>
              </div>

              <textarea
                disabled
                placeholder="I'm feeling adventurous and want something with epic landscapes..."
                className="w-full h-32 bg-background/50 border border-border rounded-lg p-4 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 disabled:cursor-not-allowed"
              />

              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-3">Quick moods</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {moodChips.map((mood) => (
                    <Badge
                      key={mood}
                      variant="secondary"
                      className="px-3 py-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer"
                    >
                      {mood}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button disabled className="w-full min-h-[44px]">
                <Sparkles className="w-4 h-4 mr-2" />
                Get Recommendations
              </Button>
            </div>
          </motion.div>

          {/* Right content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              Your Mood, Your Movies
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Our AI understands the nuances of your feelings and matches them with films that
              resonate. Whether you&apos;re looking for comfort, excitement, or something to make you
              think, we&apos;ve got you covered.
            </p>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Simply describe how you&apos;re feeling, and let our intelligent recommendation engine do
              the rest. It&apos;s like having a film critic who knows you personally.
            </p>
            <Button size="lg" asChild className="min-h-[44px] px-8">
              <Link href="/signup">Try It Free</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
