export type DiscoverMoviesParams = {
  genreId: string;
  sortBy: string;
  year: string;
};

export function getDefaultDiscoverParams(): DiscoverMoviesParams {
  return { genreId: "", sortBy: "popularity.desc", year: "" };
}

export const movieKeys = {
  all: ["movies"] as const,
  upcoming: () => [...movieKeys.all, "upcoming"] as const,
  category: (cat: string, page: number) =>
    [...movieKeys.all, "category", cat, page] as const,
  search: (query: string, page?: number) =>
    [
      ...movieKeys.all,
      "search",
      query,
      ...(page != null ? [page] : []),
    ] as const,
  details: (id: number) => [...movieKeys.all, "details", id] as const,
  genre: (genreIds: string) => [...movieKeys.all, "genre", genreIds] as const,
  discover: (params: DiscoverMoviesParams) =>
    [...movieKeys.all, "discover", params] as const,
  recommendations: (id: number) =>
    [...movieKeys.all, "recommendations", id] as const,
};
