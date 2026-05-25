import Link from "next/link";
import type { ReactNode } from "react";
import { MoodflixIcon } from "@/components/brand/moodflix-icon";

interface LegalLayoutProps {
  title: string;
  effectiveDate: string;
  children: ReactNode;
}

export function LegalLayout({
  title,
  effectiveDate,
  children,
}: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-[820px] mx-auto px-6 py-5 flex items-center justify-between">
          <Link
            href="/"
            aria-label="Moodflix home"
            className="flex items-center gap-2 no-underline"
          >
            <MoodflixIcon size={28} variant="dark" cutoutColor="#14110f" />
            <span className="font-display uppercase tracking-[0.04em] text-[20px] leading-none">
              oodflix
            </span>
          </Link>
          <div className="flex gap-5 font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[820px] mx-auto px-6 py-16">
        <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground mb-3">
          Effective {effectiveDate}
        </p>
        <h1 className="font-display uppercase text-[clamp(40px,6vw,72px)] leading-[0.95] tracking-[0.002em] mb-10">
          {title}
        </h1>
        <div className="legal-prose">{children}</div>

        <div className="mt-16 pt-8 border-t border-border font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground">
          <Link
            href="/"
            className="hover:text-foreground transition-colors"
          >
            ← Back to Moodflix
          </Link>
        </div>
      </main>
    </div>
  );
}
