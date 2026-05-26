"use client";

import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import type { MultiSearchResult } from "@/types/movie";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

async function fetchMulti(query: string, signal: AbortSignal) {
  const res = await fetch(
    `/api/movies/multi?q=${encodeURIComponent(query)}`,
    { signal },
  );
  if (!res.ok) throw new Error(`Multi-search failed: ${res.status}`);
  return (await res.json()) as { results: MultiSearchResult[] };
}

export function useSearchMulti(query: string) {
  const [debouncedQuery] = useDebounce(query.trim(), DEBOUNCE_MS);
  const enabled = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const queryResult = useQuery({
    queryKey: ["tmdb", "multi", debouncedQuery],
    queryFn: ({ signal }) => fetchMulti(debouncedQuery, signal),
    enabled,
    staleTime: 60_000,
  });

  return {
    ...queryResult,
    results: queryResult.data?.results ?? [],
    debouncedQuery,
    isEnabled: enabled,
  };
}
