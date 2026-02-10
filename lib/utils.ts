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

export function getBackdropUrl(
  path: string | null,
  size: keyof typeof TMDB_BACKDROP_SIZES = "md",
): string {
  if (!path) return "/placeholder-backdrop.svg";
  return `${TMDB_IMAGE_BASE}/${TMDB_BACKDROP_SIZES[size]}${path}`;
}
