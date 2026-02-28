import type { MediaType } from "@/types/media";

export type { MediaType };

export type TopHundredItem = {
  id: string;
  userId: string;
  tmdbId: number;
  mediaType: MediaType;
  rank: number;
  title: string;
  posterPath: string | null;
  addedAt: string;
};

export type AddToTopHundredInput = {
  tmdbId: number;
  mediaType: MediaType;
  rank: number;
  title: string;
  posterPath: string | null;
};

export type TopHundredActionResult =
  | { item: TopHundredItem; error?: never }
  | { item?: never; error: string };

export type TopHundredDeleteResult =
  | { success: true; error?: never }
  | { success?: never; error: string };
