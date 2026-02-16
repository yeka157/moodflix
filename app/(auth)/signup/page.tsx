import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create a Moodflix account to start discovering movies that match your mood with AI-powered recommendations.",
};

export default function SignupPage() {
  return <SignupForm />;
}
