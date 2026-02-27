import Link from "next/link";
import { MoodflixLogo } from "@/components/brand";

const footerLinks = [
  { label: "About", href: "#" },
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-background border-t border-border/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="hover:opacity-80 transition-opacity flex-shrink-0">
            <MoodflixLogo height={26} variant="dark" />
          </Link>

          {/* Nav links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Copyright + TMDB attribution */}
          <div className="flex flex-col items-center sm:items-end gap-1 text-right">
            <p className="text-sm text-muted-foreground">
              &copy; 2026 Moodflix. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Powered by{" "}
              <a
                href="https://www.themoviedb.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-muted-foreground transition-colors underline underline-offset-2"
              >
                TMDB
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
