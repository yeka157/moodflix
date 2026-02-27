"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoodflixLogo } from "@/components/brand/moodflix-logo";

export function LandingNavbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-border/50"
    >
      <div className="container mx-auto h-full px-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center hover:opacity-80 transition-opacity"
          aria-label="Moodflix"
        >
          <MoodflixLogo height={30} variant="dark" />
        </Link>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="default"
            asChild
            className="min-w-[44px] min-h-[44px]"
          >
            <Link href="/login">Sign In</Link>
          </Button>
          <Button size="default" asChild className="min-w-[44px] min-h-[44px]">
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
