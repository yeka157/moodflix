"use client";

import { motion } from "framer-motion";
import { Compass, BookmarkCheck, Sparkles } from "lucide-react";

const features = [
  {
    icon: Compass,
    title: "Smart Discovery",
    description:
      "Browse trending movies, search our vast database, and find streaming links. Never wonder where to watch again.",
  },
  {
    icon: BookmarkCheck,
    title: "Personal Watchlist",
    description:
      "Track what you want to watch, what you're watching now, and rate movies you've seen. Your film journey, organized.",
  },
  {
    icon: Sparkles,
    title: "AI Mood Match",
    description:
      "Describe how you're feeling, and our AI will recommend movies that perfectly match your current mood.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features to enhance your movie-watching experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="bg-card border border-border rounded-xl p-8 hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
