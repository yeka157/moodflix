import type { User } from "@supabase/supabase-js";
import { createClient as createBareClient } from "@supabase/supabase-js";
import { createClient as createCookieClient } from "@/lib/supabase/server";

/**
 * Resolves the authenticated user for an API route from EITHER:
 * 1. `Authorization: Bearer <supabase access token>` header (mobile clients), or
 * 2. the Supabase session cookie (web app).
 * Returns null when neither yields a valid user.
 */
export async function getApiUser(request: Request): Promise<User | null> {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (!token) return null;

    const supabase = createBareClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await supabase.auth.getUser(token);
    if (error) return null;
    return data.user;
  }

  const supabase = await createCookieClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
