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

export type AiConversation = {
  id: string;
  userId: string;
  messages: unknown; // Full AI SDK v5 message array as JSONB — not typed at DB layer
  prompt: string | null;
  createdAt: string;
};
