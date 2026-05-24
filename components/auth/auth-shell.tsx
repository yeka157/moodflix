import Link from "next/link";
import type { ReactNode } from "react";
import { MoodflixIcon } from "@/components/brand/moodflix-icon";

interface AuthShellProps {
  backdropUrl: string;
  quote: string;
  quoteAttribution: string;
  children: ReactNode;
}

export function AuthShell({
  backdropUrl,
  quote,
  quoteAttribution,
  children,
}: AuthShellProps) {
  return (
    <div className="page min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="auth-visual relative overflow-hidden bg-card hidden md:block">
        <img src={backdropUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute left-14 bottom-14 right-24 z-[2]">
          <div className="font-serif italic text-[32px] leading-[1.25] mb-[18px] text-foreground">
            &ldquo;{quote}&rdquo;
          </div>
          <div className="font-mono text-[11px] tracking-[0.14em] text-[var(--ink-2)] uppercase">
            — {quoteAttribution}
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center px-6 py-12 md:px-20 md:py-16 max-w-[560px] w-full mx-auto">
        <Link
          href="/"
          className="flex items-center gap-2.5 mb-12 no-underline"
          aria-label="Moodflix home"
        >
          <MoodflixIcon size={32} variant="dark" cutoutColor="#0a0908" />
          <span className="font-display text-2xl tracking-[0.04em] text-foreground">
            oodflix
          </span>
        </Link>
        {children}
      </div>
    </div>
  );
}
