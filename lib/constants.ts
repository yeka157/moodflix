export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export const TMDB_POSTER_SIZES = {
  sm: "w342",
  md: "w500",
  lg: "w780",
} as const;

export const TMDB_BACKDROP_SIZES = {
  sm: "w780",
  md: "w1280",
  lg: "original",
} as const;

export const GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};
