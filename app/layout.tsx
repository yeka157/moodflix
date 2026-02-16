import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://moodflix.app"),
  title: {
    default: "Moodflix",
    template: "%s | Moodflix",
  },
  description:
    "Your personal movie watchlist with AI-powered mood-based discovery. Find the perfect movie for any mood.",
  keywords: [
    "movies",
    "watchlist",
    "AI recommendations",
    "mood",
    "movie discovery",
    "streaming",
    "TMDB",
  ],
  authors: [{ name: "Moodflix" }],
  creator: "Moodflix",
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Moodflix - AI-Powered Movie Discovery",
    description:
      "Your personal movie watchlist with AI-powered mood-based discovery. Find the perfect movie for any mood.",
    siteName: "Moodflix",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Moodflix - AI-Powered Movie Discovery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Moodflix - AI-Powered Movie Discovery",
    description:
      "Your personal movie watchlist with AI-powered mood-based discovery. Find the perfect movie for any mood.",
    images: [
      {
        url: "/twitter-image.png",
        width: 1200,
        height: 675,
        alt: "Moodflix - AI-Powered Movie Discovery",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
