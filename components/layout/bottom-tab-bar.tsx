"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Tv, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  {
    href: "/home",
    label: "Home",
    icon: Home,
    exact: true,
  },
  {
    href: "/discover",
    label: "Discover",
    icon: Compass,
    exact: false,
  },
  {
    href: "/series",
    label: "Series",
    icon: Tv,
    exact: false,
  },
  {
    href: "/library",
    label: "Library",
    icon: Bookmark,
    exact: false,
  },
];

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname.startsWith(href);
}

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-sidebar border-t border-sidebar-border"
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
              "flex-1 flex flex-col items-center justify-center gap-1 transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
            aria-label={link.label}
          >
            <Icon className="size-5" aria-hidden="true" />
            <span className="text-[10px] font-medium leading-none">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
