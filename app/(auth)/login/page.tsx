import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getHeroBackdrop } from "@/lib/tmdb";

export const metadata: Metadata = {
  title: "Log In",
  description:
    "Sign in to Moodflix to access your watchlist and AI-powered movie recommendations.",
};

const FALLBACK_BACKDROP = "/placeholder-backdrop.svg";

export default async function LoginPage() {
  const backdrop = (await getHeroBackdrop()) ?? FALLBACK_BACKDROP;
  return (
    <AuthShell
      backdropUrl={backdrop}
      quote="A film is, or should be, more like music than like fiction."
      quoteAttribution="Stanley Kubrick"
    >
      <LoginForm />
    </AuthShell>
  );
}
