import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getHeroBackdrop } from "@/lib/tmdb";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create a Moodflix account to start discovering movies that match your mood with AI-powered recommendations.",
};

const FALLBACK_BACKDROP = "/placeholder-backdrop.svg";

export default async function SignupPage() {
  const backdrop = (await getHeroBackdrop()) ?? FALLBACK_BACKDROP;
  return (
    <AuthShell
      backdropUrl={backdrop}
      quote="There's no such thing as a perfect film, but every great one feels inevitable."
      quoteAttribution="Wong Kar-wai"
    >
      <SignupForm />
    </AuthShell>
  );
}
