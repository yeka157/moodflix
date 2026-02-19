import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moodflix - AI Movie Discovery",
    short_name: "Moodflix",
    description:
      "Your personal movie library with AI-powered mood-based discovery. Find the perfect movie for any mood.",
    start_url: "/home",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#FB2C36",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
