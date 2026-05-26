---
paths:
  - "hooks/**/*.ts"
---

# Hooks

- **All client-side API calls live here** as custom hooks using TanStack Query
- **Hook naming:** `use-<noun>.ts`, default export `useNoun`
- **Query keys** are tuples: `["domain", "subdomain", ...params]` (e.g., `["tmdb", "multi", debouncedQuery]`)
- **Debounce all search inputs** at 300ms via the `use-debounce` package
- **Mutations:** `useMutation` with optimistic updates via `onMutate` (save previous, patch cache, return rollback context). Roll back in `onError`, invalidate in `onSettled`.
- **Server Components and server actions do NOT belong here** — those live in `app/` and `actions/` respectively.
- **No type definitions** — import types from `@/types/<domain>`.
