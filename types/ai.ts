export type GenreSuggestion = {
  genres: { id: number; name: string }[];
  moodSummary: string;
  confirmed: boolean;
  media_type?: "movie" | "tv";
};
