import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNavbar } from "@/components/layout/app-navbar";
import { Providers } from "@/components/providers";
import NextTopLoader from "nextjs-toploader";

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
      <NextTopLoader
        color="#FB2C36"
        showSpinner={false}
        height={2}
        shadow={false}
      />
      <AppNavbar user={{ email: user.email ?? "" }} />
      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <Providers>{children}</Providers>
        </div>
      </main>
    </div>
  );
}
