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
  openGraph: {
    title: "Moodflix - AI-Powered Movie Discovery",
    description:
      "Your personal movie watchlist with AI-powered mood-based discovery. Find the perfect movie for any mood.",
    siteName: "Moodflix",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Moodflix - AI-Powered Movie Discovery",
    description:
      "Your personal movie watchlist with AI-powered mood-based discovery. Find the perfect movie for any mood.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
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
