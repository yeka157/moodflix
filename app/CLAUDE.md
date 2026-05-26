# App Router

## Page metadata

- Root layout (`app/layout.tsx`) sets `title.template: "%s | Moodflix"` — any page's `title` field is suffixed automatically.
- **Page-level `metadata.title` must be the bare title** (e.g., `"Notifications"`, not `"Notifications | Moodflix"`). Including the suffix produces `"Notifications | Moodflix | Moodflix"`.
- Import the type: `import type { Metadata } from "next";`

## Route conventions

- **Protected routes** live under `(app)/`. The `(app)/layout.tsx` handles `supabase.auth.getUser()` + redirect.
- **Auth routes** under `(auth)/` are unprotected by group convention (no shared layout w/ auth guard).
- **Detail pages** are full pages, not modals — e.g., `movie/[id]/page.tsx`, `tv/[id]/page.tsx`. Use server-side `generateMetadata` for OG/title with TMDB data.
- **`loading.tsx`** is required at any route with SSR fetches. Use skeletons matching the final layout, not spinners.

## Data fetching

- **Server Components** use `fetch()` (with `next: { revalidate }`) or `lib/tmdb.ts` helpers directly.
- **Client-side fetches** must go through hooks in `hooks/` using TanStack Query.
- **Mutations** use either Server Actions (`actions/`) or TanStack Query `useMutation` with optimistic updates.
- **Server→Client serialization:** Cannot pass functions as props. Convert Drizzle `Date` to ISO strings before returning from server actions/RSC.

## API routes

- API routes live under `app/api/`. They are server-only and can call Drizzle/TMDB directly.
- AI-specific rules live in `app/api/ai/CLAUDE.md`.
- Cron routes live under `app/api/cron/` and require `Authorization: Bearer ${CRON_SECRET}` header check.
