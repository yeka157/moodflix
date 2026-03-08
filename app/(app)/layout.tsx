import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Providers } from "@/components/providers";
import { OfflineToast } from "@/components/pwa/offline-toast";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import NextTopLoader from "nextjs-toploader";

export default async function AppLayout({ children }: { children: ReactNode }) {
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
      <AppSidebar user={{ email: user.email ?? "" }} />
      <BottomTabBar />
      <main className="md:pl-[60px] pb-16 md:pb-0 overflow-x-clip">
        <Providers>{children}</Providers>
      </main>
      <OfflineToast />
      <InstallPrompt />
    </div>
  );
}
