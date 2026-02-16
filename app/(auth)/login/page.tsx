import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log In",
  description:
    "Sign in to Moodflix to access your watchlist and AI-powered movie recommendations.",
};

export default function LoginPage() {
  return <LoginForm />;
}
