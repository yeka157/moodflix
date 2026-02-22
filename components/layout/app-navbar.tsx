"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Bookmark, LogOut, Tv } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { MoodflixLogo } from "@/components/brand/moodflix-logo";
import { MoodflixIcon } from "@/components/brand/moodflix-icon";

interface AppNavbarProps {
  user: {
    email: string;
  };
}

export function AppNavbar({ user }: AppNavbarProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

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

  function isActive(href: string, exact: boolean) {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    await logout();
  }

  const userInitial = user.email.charAt(0).toUpperCase();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto h-full px-4 flex items-center justify-between">
        {/* Left: Logo */}
        <Link
          href="/home"
          className="flex items-center hover:opacity-80 transition-opacity"
          aria-label="Moodflix home"
        >
          {/* Full wordmark on md+, M icon on mobile */}
          <span className="hidden md:flex">
            <MoodflixLogo height={28} variant="dark" />
          </span>
          <span className="flex md:hidden">
            <MoodflixIcon size={32} variant="dark" />
          </span>
        </Link>

        {/* Center-left: Nav Links */}
        <div className="flex items-center gap-1 ml-8">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href, link.exact);

            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "relative gap-2 min-h-[44px] min-w-[44px]",
                    active
                      ? "text-primary hover:text-primary hover:bg-transparent"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId={shouldReduceMotion ? undefined : "nav-active-pill"}
                      className="absolute inset-0 rounded-md bg-primary/10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <Icon className="size-5 shrink-0 relative z-10" />
                  <span className="hidden md:inline relative z-10">{link.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Right: User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative size-10 rounded-full p-0 min-h-[44px] min-w-[44px]"
            >
              <Avatar className="size-10">
                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Account</p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
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
    </nav>
  );
}
