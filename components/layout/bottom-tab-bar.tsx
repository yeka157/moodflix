"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Tv, Bookmark, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/home", label: "Home", icon: Home, exact: true },
  { href: "/discover", label: "Movies", icon: Compass, exact: false },
  { href: "/series", label: "Series", icon: Tv, exact: false },
  { href: "/library", label: "Library", icon: Bookmark, exact: false },
  { href: "/settings", label: "Settings", icon: Settings, exact: true },
];

const DEEP_ROUTE_PARENTS: Record<string, string> = {
  "/movie": "/discover",
  "/tv": "/series",
};

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  if (pathname.startsWith(href)) return true;
  for (const [prefix, parent] of Object.entries(DEEP_ROUTE_PARENTS)) {
    if (pathname.startsWith(prefix) && href === parent) return true;
  }
  return false;
}

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 w-full max-w-full overflow-hidden backdrop-blur-xl backdrop-saturate-150 bg-background/85 border-t border-border"
      aria-label="Mobile navigation"
    >
      {navLinks.map((link) => {
        const Icon = link.icon;
        const active = isActive(pathname, link.href, link.exact);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "relative flex-1 min-w-0 flex flex-col items-center justify-center gap-1 transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
            aria-label={link.label}
          >
            {active && (
              <span
                aria-hidden
                className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-7 rounded-b-[3px] bg-primary"
              />
            )}
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            <span className="font-mono text-[9.5px] font-medium leading-none truncate max-w-full uppercase tracking-[0.14em]">
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
