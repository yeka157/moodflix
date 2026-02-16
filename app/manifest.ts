import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moodflix - AI Movie Discovery",
    short_name: "Moodflix",
    description:
      "Your personal movie watchlist with AI-powered mood-based discovery. Find the perfect movie for any mood.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#dc2626",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
