import type { Metadata } from "next";
import {
  Inter,
  Bebas_Neue,
  Instrument_Serif,
  JetBrains_Mono,
} from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SwRegister } from "@/components/pwa/sw-register";
import { AnalyticsGate } from "@/components/analytics-gate";
import "./globals.css";

const PREFS_BOOTSTRAP_SCRIPT = `
(function() {
  try {
    var d = document.documentElement;
    var accent = localStorage.getItem("mf:accent");
    if (accent && accent !== "red") d.dataset.accent = accent;
    if (localStorage.getItem("mf:reducedMotion") === "1") d.dataset.reduceMotion = "true";
  } catch (_) {}
})();
`;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
  display: "block",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
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
        <script
          dangerouslySetInnerHTML={{ __html: PREFS_BOOTSTRAP_SCRIPT }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetBrainsMono.variable} ${bebasNeue.variable} ${instrumentSerif.variable} font-sans antialiased cinematic-skin`}
      >
        <SwRegister>
          {children}
          <AnalyticsGate />
          <Toaster />
        </SwRegister>
      </body>
    </html>
  );
}
