"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MoodflixLogo } from "@/components/brand/moodflix-logo";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300",
        scrolled ? "backdrop-blur-md bg-background/80" : "bg-transparent"
      )}
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
          <Button variant="ghost" size="default" asChild className="min-w-[44px] min-h-[44px]">
            <Link href="/login">Log In</Link>
          </Button>
          <Button size="default" asChild className="min-w-[44px] min-h-[44px]">
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
