export type TVCategory =
  | "trending"
  | "top_rated"
  | "airing_today"
  | "korean_drama"
  | "chinese_drama";

export type DiscoverTVParams = {
  genreId: string;
  sortBy: string;
  year: string;
};

export const tvKeys = {
  all: ["tv"] as const,
  category: (cat: TVCategory) => [...tvKeys.all, "category", cat] as const,
  details: (id: number) => [...tvKeys.all, "details", id] as const,
  discover: (params: DiscoverTVParams) =>
    [...tvKeys.all, "discover", params] as const,
  genre: (genreIds: string) => [...tvKeys.all, "genre", genreIds] as const,
  search: (query: string) => [...tvKeys.all, "search", query] as const,
};
