"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  Tv,
  Bookmark,
  LogOut,
  Settings,
} from "lucide-react";
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
import { MoodflixIcon } from "@/components/brand/moodflix-icon";

interface AppSidebarProps {
  user: {
    email: string;
  };
}

const navLinks = [
  { href: "/home", label: "Home", icon: Home, exact: true },
  { href: "/discover", label: "Movies", icon: Compass, exact: false },
  { href: "/series", label: "Series", icon: Tv, exact: false },
  { href: "/library", label: "Library", icon: Bookmark, exact: false },
  { href: "/settings", label: "Settings", icon: Settings, exact: false },
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

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const userInitial = user.email.charAt(0).toUpperCase();

  async function handleLogout() {
    await logout();
  }

  return (
    <aside
      className="hidden md:flex fixed top-0 left-0 bottom-0 z-50 flex-col items-center bg-sidebar border-r border-sidebar-border w-[72px] pt-[18px] pb-6"
      aria-label="Primary navigation"
    >
      {/* Logo mark */}
      <Link
        href="/home"
        className="mb-7 grid place-items-center rounded-[9px]"
        aria-label="Moodflix home"
      >
        <MoodflixIcon size={26} variant="dark" cutoutColor="#14110f" />
      </Link>

      <nav className="flex flex-col items-center gap-1.5 flex-1">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(pathname, link.href, link.exact);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative grid place-items-center w-11 h-11 rounded-[10px] transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-[3px] bg-primary"
                />
              )}
              <Icon className="size-5" aria-hidden="true" />
              {/* Tooltip flyout */}
              <span
                className={cn(
                  "pointer-events-none absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2",
                  "whitespace-nowrap rounded-md border border-border bg-card px-2.5 py-1.5",
                  "text-xs text-foreground opacity-0 transition-opacity duration-150",
                  "group-hover:opacity-100 group-focus-visible:opacity-100",
                )}
                role="tooltip"
              >
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User avatar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="relative grid place-items-center"
            aria-label="User menu"
          >
            <Avatar
              className="size-9 border-2"
              style={{ borderColor: "var(--bg-elev)" }}
            >
              <AvatarFallback
                className="text-[13px] font-semibold text-white"
                style={{
                  background:
                    "linear-gradient(135deg, var(--violet), var(--red))",
                }}
              >
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <span
              aria-hidden
              className="absolute bottom-0 right-0 size-2 rounded-full border-2"
              style={{
                background: "var(--emerald)",
                borderColor: "var(--bg-elev)",
              }}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="end" className="w-56">
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <Settings className="mr-2 size-4" />
              <span>Settings</span>
            </Link>
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
    </aside>
  );
}
