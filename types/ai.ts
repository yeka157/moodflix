import type { MediaType } from "@/types/media";

export type { MediaType };

export type GenreSuggestion = {
  genres: { id: number; name: string }[];
  moodSummary: string;
  confirmed: boolean;
  media_type?: MediaType;
};
