"use client";

import { useSyncExternalStore } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const STORAGE_KEY = "mf:analytics";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", handler);
  window.addEventListener("mf:analytics-change", callback);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("mf:analytics-change", callback);
  };
}

function getEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(STORAGE_KEY);
  return v === null ? true : v === "1";
}

function getServerEnabled(): boolean {
  return true;
}

export function AnalyticsGate() {
  const enabled = useSyncExternalStore(subscribe, getEnabled, getServerEnabled);
  if (!enabled) return null;
  return <SpeedInsights />;
}
