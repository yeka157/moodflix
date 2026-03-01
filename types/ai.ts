import type { MediaType } from "@/types/media";

export type { MediaType };

export type GenreSuggestion = {
  genres: { id: number; name: string }[];
  moodSummary: string;
  confirmed: boolean;
  media_type?: MediaType;
};

export type AiConversation = {
  id: string;
  userId: string;
  messages: unknown; // Full AI SDK v5 message array as JSONB — not typed at DB layer
  prompt: string | null;
  createdAt: string;
};
