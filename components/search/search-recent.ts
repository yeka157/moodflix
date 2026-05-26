const STORAGE_KEY = "moodflix:search:recent";
const MAX_RECENT = 8;

export type RecentEntry = { q: string; ts: number };

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getRecent(): RecentEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is RecentEntry =>
          typeof e === "object" &&
          e !== null &&
          typeof (e as RecentEntry).q === "string" &&
          typeof (e as RecentEntry).ts === "number",
      )
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function addRecent(query: string): void {
  if (!isBrowser()) return;
  const trimmed = query.trim();
  if (!trimmed) return;
  const lower = trimmed.toLowerCase();
  const existing = getRecent().filter((e) => e.q.toLowerCase() !== lower);
  const next: RecentEntry[] = [
    { q: trimmed, ts: Date.now() },
    ...existing,
  ].slice(0, MAX_RECENT);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // quota or private mode — swallow
  }
}

export function clearRecent(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // swallow
  }
}
