import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { NotificationList } from "@/components/notifications/notification-list";

export const metadata: Metadata = {
  title: "Notifications | Moodflix",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-4 md:px-8 py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Notifications
      </h1>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <NotificationList variant="page" />
      </div>
    </div>
  );
}
