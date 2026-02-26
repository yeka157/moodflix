"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/drizzle";
import { profiles } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

const displayNameSchema = z
  .string()
  .min(1, "Display name is required")
  .max(50, "Display name must be 50 characters or less");

export async function updateDisplayName(displayName: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    const result = displayNameSchema.safeParse(displayName.trim());
    if (!result.success) {
      return { error: result.error.issues[0]?.message ?? "Invalid name" };
    }

    await db
      .update(profiles)
      .set({ username: result.data })
      .where(eq(profiles.id, user.id));

    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Failed to update display name" };
  }
}
