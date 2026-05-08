"use client";

import { SerwistProvider, useSerwist } from "@serwist/turbopack/react";
import { useEffect } from "react";

function SerwistRegistrar() {
  const { serwist } = useSerwist();
  useEffect(() => {
    if (!serwist) return;
    serwist.register().catch((err) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[sw] register failed:", err);
      }
    });
  }, [serwist]);
  return null;
}

export function SwRegister({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      register={false}
      reloadOnOnline={false}
    >
      <SerwistRegistrar />
      {children}
    </SerwistProvider>
  );
}
