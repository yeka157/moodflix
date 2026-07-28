import type { MediaType } from "@/types/media";

export type { MediaType };

export type GenreSuggestion = {
  genres: { id: number; name: string }[];
  moodSummary: string;
  confirmed: boolean;
  media_type?: MediaType;
  origin_country?: string;
};

export type IdentifiedMedia = {
  title: string;
  tmdbId: number;
  mediaType: MediaType;
  year?: string;
  confidence: "high" | "medium" | "low";
  verified: boolean;
  posterPath: string | null;
  overview: string | null;
};

export type IdentifiedMediaResult = {
  matches: IdentifiedMedia[];
  query: string;
};

/**
 * Fields composed into the text that gets embedded for a catalog title.
 *
 * Numeric fields (rating, popularity, runtime) are deliberately absent — they
 * embed poorly. They stay as columns on tmdb_media for filtering/reranking.
 */
export type MediaTextInput = {
  title: string;
  year: string | null; // "2018"
  originWords: string | null; // "Korean TV drama" — countries/language as words
  genres: string[];
  director: string | null;
  cast: string[]; // top 3
  keywords: string[];
  overview: string | null;
};

export type AiConversation = {
  id: string;
  userId: string;
  messages: unknown; // Full AI SDK v5 message array as JSONB — not typed at DB layer
  prompt: string | null;
  createdAt: string;
};
