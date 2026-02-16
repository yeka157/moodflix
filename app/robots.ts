import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/home", "/discover", "/watchlist", "/api/"],
      },
    ],
    sitemap: "https://moodflix.app/sitemap.xml",
  };
}
