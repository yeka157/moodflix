import Link from "next/link";
import { MoodflixLogo } from "@/components/brand";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <MoodflixLogo height={28} variant="dark" />
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/about"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </nav>

          <p className="text-sm text-muted-foreground">
            © {currentYear} Moodflix. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
