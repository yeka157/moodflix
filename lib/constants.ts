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

export const PROVIDER_URLS: Record<number, string> = {
  8: "https://www.netflix.com",
  9: "https://www.amazon.com/primevideo",
  10: "https://www.amazon.com/primevideo",
  119: "https://www.amazon.com/primevideo",
  337: "https://www.disneyplus.com",
  350: "https://tv.apple.com",
  2: "https://tv.apple.com",
  3: "https://play.google.com/store/movies",
  15: "https://www.hulu.com",
  1899: "https://www.max.com",
  384: "https://www.max.com",
  531: "https://www.paramountplus.com",
  386: "https://www.peacocktv.com",
  122: "https://www.hotstar.com",
  11: "https://mubi.com",
  283: "https://www.crunchyroll.com",
  192: "https://www.youtube.com",
  188: "https://www.youtube.com/premium",
  489: "https://www.vidio.com",
  613: "https://www.wetv.vip",
  158: "https://www.viu.com",
};

export const GENRE_MOOD_MESSAGES: Record<number, string[]> = {
  28: [
    "For the thrill-seeker who lives for the chase",
    "Your heart beats to the rhythm of daring escapes",
    "A soul drawn to heroes who never back down",
  ],
  12: [
    "For the wanderer who seeks uncharted worlds",
    "Your spirit craves journeys beyond the horizon",
    "A heart that finds home in the unknown",
  ],
  16: [
    "For the dreamer who sees magic in every frame",
    "Your imagination knows no bounds or borders",
    "A spirit that believes in worlds drawn from wonder",
  ],
  35: [
    "For the soul that finds light in every shadow",
    "Your laughter is the soundtrack of a life well-lived",
    "A heart that heals the world one smile at a time",
  ],
  80: [
    "For the mind that loves unraveling dark puzzles",
    "Your curiosity pulls you into shadowy alleys and whispered secrets",
    "A detective's heart beating beneath a calm exterior",
  ],
  99: [
    "For the seeker of truths hidden in plain sight",
    "Your mind hungers for stories the world forgot to tell",
    "A soul that finds poetry in the real and the raw",
  ],
  18: [
    "For the heart that feels every story to its core",
    "Your soul resonates with the quiet weight of human experience",
    "A spirit drawn to the beautiful complexity of being alive",
  ],
  10751: [
    "For the heart that treasures moments shared together",
    "Your warmth turns every movie night into a cherished memory",
    "A soul that believes the best stories bring us closer",
  ],
  14: [
    "For the dreamer who believes in realms beyond our own",
    "Your imagination dances with dragons and ancient magic",
    "A soul that finds truth in the impossible",
  ],
  36: [
    "For the mind that walks through the corridors of time",
    "Your heart finds wisdom in echoes of the past",
    "A soul drawn to the stories that shaped our world",
  ],
  27: [
    "For the brave soul who finds beauty in the darkness",
    "Your pulse quickens where others dare not look",
    "A spirit that dances with shadows and survives",
  ],
  10402: [
    "For the soul that hears melodies in every moment",
    "Your heart beats in rhythm with stories set to song",
    "A spirit that finds transcendence through melody and movement",
  ],
  9648: [
    "For the curious mind that loves a puzzle unsolved",
    "Your intuition navigates the fog where answers hide",
    "A seeker of secrets who reads between every line",
  ],
  10749: [
    "For the romantic heart that believes in the extraordinary",
    "Your soul is drawn to stories where love rewrites the stars",
    "A heart that finds magic in the space between two people",
  ],
  878: [
    "For the visionary who gazes beyond the stars",
    "Your mind explores futures that others can only imagine",
    "A soul wired for wonder in the vast unknown",
  ],
  10770: [
    "For the soul that finds comfort in familiar screens",
    "Your heart appreciates stories crafted for quiet evenings",
    "A spirit that values the intimate power of small-screen tales",
  ],
  53: [
    "For the edge-dweller who thrives on suspense",
    "Your pulse races where tension meets the tipping point",
    "A mind that craves the twist you never see coming",
  ],
  10752: [
    "For the soul that honors courage in the face of chaos",
    "Your heart holds space for stories of sacrifice and valor",
    "A spirit that finds meaning in the cost of freedom",
  ],
  37: [
    "For the lone rider who roams the open frontier",
    "Your spirit is drawn to dust, honor, and the setting sun",
    "A soul that finds freedom in the vastness of the wild",
  ],
};

export const DEFAULT_MOOD_MESSAGE = "For the cinephile with exquisite taste";
