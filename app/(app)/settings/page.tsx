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
    <div
      className="page section"
      style={{ paddingTop: 24, paddingBottom: 120 }}
    >
      <div style={{ marginBottom: 56 }}>
        <div className="section-eyebrow">
          <span className="bar" />
          <span className="id">PROFILE &amp; PREFERENCES</span>
        </div>
        <h1
          className="display"
          style={{ fontSize: "clamp(56px, 7vw, 104px)", margin: 0 }}
        >
          Settings.
        </h1>
      </div>

      <SettingsForm
        displayName={displayName}
        email={email}
        avatarUrl={avatarUrl}
      />
    </div>
  );
}
