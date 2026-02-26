"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/drizzle";
import { profiles } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

const usernameSchema = z
  .string()
  .max(30, "Username must be 30 characters or less")
  .regex(
    /^[a-zA-Z0-9_-]*$/,
    "Username can only contain letters, numbers, hyphens, and underscores",
  )
  .refine((val) => val === "" || val.length >= 2, {
    message: "Username must be at least 2 characters",
  });

export async function updateUsername(username: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    const result = usernameSchema.safeParse(username);
    if (!result.success) {
      return { error: result.error.issues[0]?.message ?? "Invalid username" };
    }

    await db
      .update(profiles)
      .set({ username: username || null })
      .where(eq(profiles.id, user.id));

    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Failed to update username" };
  }
}
