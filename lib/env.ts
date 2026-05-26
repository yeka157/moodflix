/**
 * Runtime environment variable validation.
 *
 * SERVER-ONLY — do not import from client components. Client code should
 * continue to read `process.env.NEXT_PUBLIC_*` directly (Next.js inlines those
 * at build time).
 *
 * Imported by `instrumentation.ts` so the app fails fast on startup if any
 * required variable is missing or malformed.
 */
import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Supabase (NEXT_PUBLIC_* are inlined at build time but still validated here)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: z.string().min(1),

  // TMDB
  TMDB_API_READ_KEY: z.string().min(1),

  // Google AI (Gemini)
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),

  // Cron — must be long enough to resist brute-force
  CRON_SECRET: z.string().min(16),

  // Web Push (VAPID)
  VAPID_PRIVATE_KEY: z.string().min(1),
  VAPID_SUBJECT: z.string().startsWith("mailto:"),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.flatten().fieldErrors;
  console.error("Invalid environment variables:");
  for (const [key, errors] of Object.entries(formatted)) {
    console.error(`  - ${key}: ${errors?.join(", ")}`);
  }
  throw new Error(
    "Invalid environment variables. See logs above for details.",
  );
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
