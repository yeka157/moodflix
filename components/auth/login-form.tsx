"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

import { login, loginWithGoogle } from "@/actions/auth";

import type { LoginFormData } from "@/types/auth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const OAUTH_BUTTON_CLASSES =
  "flex-1 flex items-center justify-center gap-2 p-3 border border-border rounded-[10px] bg-card text-foreground text-[13px] font-medium transition-[border-color,background-color] duration-200 hover:border-[var(--line-strong)] hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer";

const INPUT_CLASSES =
  "w-full px-3.5 py-[11px] bg-background border border-border rounded-[10px] text-[13.5px] text-foreground transition-colors focus:border-[var(--line-strong)] outline-none disabled:opacity-70 aria-[invalid=true]:border-primary placeholder:text-muted-foreground";

const LABEL_CLASSES = "block text-xs font-medium mb-1.5 text-[var(--ink-2)]";

const DIVIDER_CLASSES =
  "flex items-center gap-3.5 font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground my-7 uppercase before:content-[''] before:flex-1 before:h-px before:bg-border after:content-[''] after:flex-1 after:h-px after:bg-border";

const SUBMIT_BUTTON_CLASSES =
  "w-full justify-center mt-2 inline-flex items-center gap-2 px-[26px] py-[14px] rounded-full text-sm font-medium tracking-[0.01em] transition-[transform,background-color,color,border-color] duration-200 hover:-translate-y-px active:translate-y-0 active:scale-[0.98] whitespace-nowrap cursor-pointer disabled:opacity-60 bg-primary text-white hover:bg-[var(--red-deep)]";

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function LoginFormInner() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "auth_callback_error") {
      toast.error("Authentication failed. Please try again.");
    }
  }, [searchParams]);

  async function onSubmit(data: LoginFormData) {
    setIsSubmitting(true);
    try {
      const result = await login(data);
      if (result?.error) {
        toast.error(result.error);
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoogleLogin() {
    startTransition(async () => {
      const result = await loginWithGoogle();
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.url) {
        window.location.href = result.url;
      }
    });
  }

  return (
    <>
      <h1 className="font-display uppercase text-[48px] md:text-[64px] leading-[0.9] tracking-[0.005em] m-0 mb-3">
        Welcome <span className="font-serif italic normal-case text-primary">back.</span>
      </h1>
      <p className="text-[var(--ink-2)] mb-9">
        Pick up where you left off. Your library and watch history are waiting.
      </p>

      <div className="flex gap-2.5 mb-6">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isPending}
          className={OAUTH_BUTTON_CLASSES}
        >
          <GoogleIcon />
          {isPending ? "Signing in…" : "Continue with Google"}
        </button>
      </div>

      <div className={DIVIDER_CLASSES}>or continue with email</div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-4">
          <label htmlFor="login-email" className={LABEL_CLASSES}>Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            aria-invalid={errors.email ? "true" : "false"}
            className={INPUT_CLASSES}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-primary mt-1.5">{errors.email.message}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="login-password" className={LABEL_CLASSES}>Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={errors.password ? "true" : "false"}
            className={INPUT_CLASSES}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-primary mt-1.5">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          className={SUBMIT_BUTTON_CLASSES}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in…" : "Enter Moodflix"}
          <ArrowRight size={14} />
        </button>
      </form>

      <div className="mt-6 text-[13px] text-muted-foreground text-center">
        New here?{" "}
        <Link href="/signup" className="text-foreground underline">
          Create an account
        </Link>
      </div>
    </>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={null}>
      <LoginFormInner />
    </Suspense>
  );
}
