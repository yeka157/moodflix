"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import { clearRecent } from "@/components/search/search-recent";
import { TooltipProvider } from "@/components/ui/tooltip";
import { makeQueryClient } from "@/lib/query-client";
import { createClient } from "@/lib/supabase/client";
import type { ProvidersProps } from "@/types/session";

const AccountContext = createContext("");

export function useAccountId() {
  return useContext(AccountContext);
}

function AccountProviders({ children, userId }: ProvidersProps) {
  // This component is keyed by identity. In-flight queries and optimistic
  // mutations can only update the old account's discarded client.
  const [queryClient] = useState(makeQueryClient);
  const [changingAccount, setChangingAccount] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = createClient().auth.onAuthStateChange((_event, session) => {
      if (session?.user.id === userId) {
        return;
      }
      queryClient.clear();
      clearRecent(userId);
      setChangingAccount(true);
      window.location.replace(session ? "/home" : "/login");
    });
    return () => {
      subscription.unsubscribe();
      queryClient.clear();
      clearRecent(userId);
    };
  }, [queryClient, userId]);

  if (changingAccount) {
    return <p role="status">Updating session…</p>;
  }

  return (
    <AccountContext.Provider value={userId}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
      </QueryClientProvider>
    </AccountContext.Provider>
  );
}

export function Providers(props: ProvidersProps) {
  return <AccountProviders key={props.userId} {...props} />;
}
