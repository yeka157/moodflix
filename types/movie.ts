export type Movie = {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  adult: boolean;
  original_language: string;
  video: boolean;
  media_type?: "movie" | "tv";
};

export type MovieListResponse = {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
};

export type MovieCategory = "trending" | "popular" | "top_rated";

export type MovieDetails = {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  genres: { id: number; name: string }[];
  popularity: number;
  adult: boolean;
  original_language: string;
  video: boolean;
  runtime: number | null;
  tagline: string | null;
  status: string;
  budget: number;
  revenue: number;
};

export type WatchProvider = {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
};

export type WatchProviderResult = {
  link: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
};

export type WatchProvidersResponse = {
  id: number;
  results: Record<string, WatchProviderResult>;
};

export type MovieCredits = {
  cast: {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
  }[];
  crew: {
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
  }[];
};

export type MovieDetailsWithExtras = MovieDetails & {
  credits: MovieCredits;
  "watch/providers": WatchProvidersResponse;
};

export type MovieDetailsResponse = MovieDetailsWithExtras & {
  watchProviders: WatchProviderResult | null;
  watchCountry: string;
};

export type RecommendationSource = {
  tmdbId: number;
  title: string;
};

export type PersonalizedData = {
  moodMessage: string;
  sourceMovies: RecommendationSource[];
  topGenreId: number;
  topGenreName: string;
  rowPatternIndex: number;
};
