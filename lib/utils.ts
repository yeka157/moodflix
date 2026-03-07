import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TMDB_IMAGE_BASE, TMDB_POSTER_SIZES, TMDB_BACKDROP_SIZES } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPosterUrl(
  path: string | null,
  size: keyof typeof TMDB_POSTER_SIZES = "md",
): string {
  if (!path) return "/placeholder-poster.svg";
  return `${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZES[size]}${path}`;
}

export function formatReleaseDateBadge(dateStr: string | undefined | null): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr + "T00:00:00"); // Avoid timezone shift
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (date <= now) return null; // Only show for future dates
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export function getBackdropUrl(
  path: string | null,
  size: keyof typeof TMDB_BACKDROP_SIZES = "md",
): string {
  if (!path) return "/placeholder-backdrop.svg";
  return `${TMDB_IMAGE_BASE}/${TMDB_BACKDROP_SIZES[size]}${path}`;
}
