# Data Fetching

- **All client-side API calls live in custom hooks** under `hooks/` using TanStack Query
- **Server Components** use direct `fetch()` or server actions
- **Mutations** use either Server Actions or TanStack Query `useMutation` with optimistic updates
- **Drizzle bypasses Supabase RLS** (direct connection) — ALL Drizzle queries must include explicit `eq(table.userId, user.id)` WHERE clauses for authorization
- **Server action serialization** — Drizzle returns `Date` objects for timestamps; convert to ISO strings via `.toISOString()` before returning from server actions
- **TanStack Query keys** are tuples: `["domain", "subdomain", ...params]` (e.g., `["tmdb", "multi", debouncedQuery]`)
- **Debounce all search inputs** at 300ms via the `use-debounce` package
