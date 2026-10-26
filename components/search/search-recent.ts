import type { RecentEntry } from "@/types/session";

const STORAGE_KEY = "moodflix:search:recent";
const MAX_RECENT = 8;

function isBrowser(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined"
    );
  } catch {
    return false;
  }
}

export function getRecent(userId: string): RecentEntry[] {
  if (!(userId && isBrowser())) {
    return [];
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    const raw = window.localStorage.getItem(`${STORAGE_KEY}:${userId}`);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter(
        (e): e is RecentEntry =>
          typeof e === "object" &&
          e !== null &&
          typeof (e as RecentEntry).q === "string" &&
          typeof (e as RecentEntry).ts === "number"
      )
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function addRecent(userId: string, query: string): void {
  if (!(userId && isBrowser())) {
    return;
  }
  const trimmed = query.trim();
  if (!trimmed) {
    return;
  }
  const lower = trimmed.toLowerCase();
  const existing = getRecent(userId).filter((e) => e.q.toLowerCase() !== lower);
  const next: RecentEntry[] = [
    { q: trimmed, ts: Date.now() },
    ...existing,
  ].slice(0, MAX_RECENT);
  try {
    window.localStorage.setItem(
      `${STORAGE_KEY}:${userId}`,
      JSON.stringify(next)
    );
  } catch {
    // quota or private mode — swallow
  }
}

export function clearRecent(userId: string): void {
  if (!(userId && isBrowser())) {
    return;
  }
  try {
    window.localStorage.removeItem(`${STORAGE_KEY}:${userId}`);
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // swallow
  }
}
