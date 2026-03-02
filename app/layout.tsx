import type { Metadata } from "next";
import { Inter, Geist_Mono, Bebas_Neue } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SwRegister } from "@/components/pwa/sw-register";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
  display: "block",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://moodflix.app"),
  title: {
    default: "Moodflix",
    template: "%s | Moodflix",
  },
  description:
    "Your personal movie library with AI-powered mood-based discovery. Find the perfect movie for any mood.",
  keywords: [
    "movies",
    "library",
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
      "Your personal movie library with AI-powered mood-based discovery. Find the perfect movie for any mood.",
    siteName: "Moodflix",
    locale: "en_US",
    type: "website",
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
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body
        className={`${inter.variable} ${geistMono.variable} ${bebasNeue.variable} font-sans antialiased`}
      >
        <SwRegister>
          {children}
          <SpeedInsights />
          <Toaster />
        </SwRegister>
      </body>
    </html>
  );
}
