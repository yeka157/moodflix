import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNavbar } from "@/components/layout/app-navbar";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar user={{ email: user.email ?? "" }} />
      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
