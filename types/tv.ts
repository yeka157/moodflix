import type {
  Movie,
  MovieCredits,
  WatchProvidersResponse,
  WatchProviderResult,
} from "@/types/movie";

export type TVShow = {
  id: number;
  name: string;
  original_name: string;
  first_air_date: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  adult: boolean;
  original_language: string;
  origin_country: string[];
};

export type TVListResponse = {
  page: number;
  results: TVShow[];
  total_pages: number;
  total_results: number;
};

export type TVCreatedBy = {
  id: number;
  credit_id: string;
  name: string;
  gender: number;
  profile_path: string | null;
};

export type TVNetwork = {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
};

export type TVDetails = TVShow & {
  genres: { id: number; name: string }[];
  status: string;
  tagline: string | null;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  created_by: TVCreatedBy[];
  networks: TVNetwork[];
};

export type TVDetailsWithExtras = TVDetails & {
  credits: MovieCredits;
  "watch/providers": WatchProvidersResponse;
};

export type TVDetailsResponse = TVDetailsWithExtras & {
  watchProviders: WatchProviderResult | null;
  watchCountry: string;
  mediaType: "tv";
};

export function normalizeTVShow(tv: TVShow): Movie {
  return {
    id: tv.id,
    title: tv.name,
    original_title: tv.original_name,
    overview: tv.overview,
    poster_path: tv.poster_path,
    backdrop_path: tv.backdrop_path,
    release_date: tv.first_air_date,
    vote_average: tv.vote_average,
    vote_count: tv.vote_count,
    genre_ids: tv.genre_ids,
    popularity: tv.popularity,
    adult: tv.adult,
    original_language: tv.original_language,
    video: false,
  };
}
