import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/drizzle";
import { profiles } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { SettingsForm } from "@/components/settings/settings-form";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  const savedName = profile[0]?.username ?? null;
  const displayName =
    savedName ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "User";
  const email = user.email ?? "";
  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile and preferences
        </p>
      </div>

      <SettingsForm
        displayName={displayName}
        email={email}
        avatarUrl={avatarUrl}
      />
    </div>
  );
}
