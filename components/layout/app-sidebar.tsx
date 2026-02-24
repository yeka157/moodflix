"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Tv, Bookmark, LogOut, Settings } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { MoodflixLogo } from "@/components/brand/moodflix-logo";

interface AppSidebarProps {
  user: {
    email: string;
  };
}

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

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);

  const springTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 280, damping: 26 };

  const userInitial = user.email.charAt(0).toUpperCase();

  async function handleLogout() {
    await logout();
  }

  return (
    <motion.aside
      className="hidden md:flex flex-col fixed top-0 left-0 h-full z-50 bg-sidebar border-r border-sidebar-border overflow-hidden"
      initial={false}
      animate={{ width: expanded ? 200 : 60 }}
      transition={springTransition}
      onHoverStart={() => setExpanded(true)}
      onHoverEnd={() => setExpanded(false)}
    >
      {/* Logo area — always render full logo, clip text based on expanded state */}
      <div className="flex items-center h-16 px-4 shrink-0 overflow-hidden">
        <motion.div
          className="shrink-0 overflow-hidden"
          animate={{ width: expanded ? "auto" : 28 }}
          transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 26 }}
        >
          <MoodflixLogo height={28} variant="dark" />
        </motion.div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 px-2 py-2" aria-label="Main navigation">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(pathname, link.href, link.exact);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex items-center gap-3 h-11 px-3 rounded-md transition-colors",
                active
                  ? "text-primary"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <motion.span
                  layoutId={shouldReduceMotion ? undefined : "sidebar-active-pill"}
                  className="absolute inset-0 rounded-md bg-primary/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon className="size-5 shrink-0 relative z-10" aria-hidden="true" />
              <motion.span
                className="relative z-10 whitespace-nowrap text-sm font-medium overflow-hidden"
                animate={{
                  opacity: expanded ? 1 : 0,
                  width: expanded ? "auto" : 0,
                }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.15 }}
              >
                {link.label}
              </motion.span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-2 pb-4 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-3 w-full h-11 px-3 rounded-md transition-colors",
                "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              )}
              aria-label="User menu"
            >
              <Avatar className="size-7 shrink-0">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <motion.span
                className="text-sm truncate overflow-hidden"
                animate={{
                  opacity: expanded ? 1 : 0,
                  width: expanded ? "auto" : 0,
                }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.15 }}
              >
                {user.email}
              </motion.span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56">
            <DropdownMenuItem disabled className="cursor-not-allowed">
              <Settings className="mr-2 size-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.aside>
  );
}
