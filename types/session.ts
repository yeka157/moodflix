import type { ReactNode } from "react";

export interface ProvidersProps {
  children: ReactNode;
  userId: string;
}

export interface RecentEntry {
  q: string;
  ts: number;
}
