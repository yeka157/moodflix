"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Compass, Bookmark, Sparkles, Tv } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

const iconMap: Record<string, LucideIcon> = {
  Compass,
  Bookmark,
  Sparkles,
  Tv,
};

interface FeatureCard {
  href: string;
  icon: string;
  title: string;
  description: string;
}

interface FeatureCardGridProps {
  cards: FeatureCard[];
}

export function FeatureCardGrid({ cards }: FeatureCardGridProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {cards.map((card) => {
        const Icon = iconMap[card.icon] ?? Compass;
        return (
          <motion.div key={card.href} variants={item}>
            <Link href={card.href} className="block group">
              <Card className="h-full p-6 bg-card border border-border hover:border-primary/50 transition-all duration-300">
                <div className="flex flex-col gap-4">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-[0_0_20px_rgba(251,44,54,0.15)]">
                    <Icon className="size-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      {card.title}
                      <ArrowRight className="size-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
