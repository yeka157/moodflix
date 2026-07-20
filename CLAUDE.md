# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

**Moodflix** — A movie + TV watchlist and recommendation SaaS with AI-powered mood-based discovery. Active development.

## Tech Stack

| Layer         | Technology                                                              |
| ------------- | ----------------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router), React 19, TypeScript                           |
| Styling       | Tailwind CSS v4, shadcn/ui (new-york style, OKLCH colors)               |
| Database      | Supabase (PostgreSQL) with Row Level Security                           |
| ORM           | Drizzle ORM with postgres-js driver                                     |
| Auth          | Supabase Auth (email/password, Google OAuth, Passkey)                   |
| AI            | Google Gemini via Vercel AI SDK v5                                      |
| AI UI         | prompt-kit (shadcn/ui-based AI components)                              |
| Data Fetching | TanStack Query (client), Next.js fetch + server actions (server)        |
| Command UI    | cmdk (Spotlight-style search palette)                                   |
| Movie Data    | TMDB API                                                                |
| Push          | web-push, Vercel Cron for release notifications                         |
| Rate Limiting | lru-cache (in-memory)                                                   |
| PWA           | Serwist                                                                 |

## Commands

```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build (also validates TypeScript)
npm run lint         # ESLint with next/core-web-vitals + typescript configs
npm run db:generate  # Generate SQL migration files from schema changes
npm run db:migrate   # Apply pending migrations to the database
npm run db:push      # Push schema directly (prototyping only)
npm run db:studio    # Open Drizzle Studio to browse/edit data
node scripts/api-smoke.mjs [bearer|watchlist|notifications|all]  # API integration smoke tests (dev server must be running)
```

See [DRIZZLE_GUIDE.md](./DRIZZLE_GUIDE.md) for the full migration workflow.

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
SUPABASE_SECRET_KEY=
DATABASE_URL=               # Supabase transaction pooler (port 6543) for runtime
DATABASE_URL_DIRECT=        # Supabase session pooler (port 5432) for Drizzle Kit migrations
TMDB_API_READ_KEY=          # TMDB Bearer token (NOT the v3 query-param api_key)
GOOGLE_GENERATIVE_AI_API_KEY=
CRON_SECRET=                # Vercel Cron auth header
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=              # mailto: address
```

## Route Structure (App Router)

- `app/page.tsx` — Landing page (revamped marketing site)
- `app/privacy/`, `app/terms/` — Legal pages
- `app/(auth)/login`, `app/(auth)/signup`, `app/(auth)/callback` — Auth
- `app/(app)/` — Protected area (sidebar + bottom tab bar + topbar w/ search palette + notifications bell)
  - `home/` — Welcome stats, AI mood section, collections bento, personalized rows
  - `home/recommendations/` — AI recommendation results
  - `discover/` — Browse/search/filter movies
  - `series/` — Browse TV series
  - `library/` — User's watchlist (was `/watchlist`)
  - `settings/`
  - `movie/[id]/`, `tv/[id]/` — Full-page detail views
  - `notifications/` — Release alerts inbox
- `app/api/movies/` — TMDB proxy (search, category, genre, multi-search, details)
- `app/api/tv/` — TMDB TV proxy
- `app/api/ai/recommend/` — Streaming AI recommendation endpoint
- `app/api/watchlist/` — Watchlist REST API (list/add, `[id]` patch/delete, `stats`, `ids`, `lookup`) — bearer or cookie auth, consumed by mobile clients
- `app/api/notifications/` — Inbox REST API (list, `unread-count`, `read`) alongside existing `subscribe`/`subscribed-ids`
- `app/api/notifications/subscribe`, `subscribed-ids` — Per-movie release alert subscriptions
- `app/api/push/subscribe` — Browser push device tokens
- `app/api/cron/release-notifications` — Vercel cron job (fires releases, inserts inbox rows)

## Key Directories

### App shell

- `components/layout/app-sidebar.tsx` — Hover-expand desktop sidebar
- `components/layout/bottom-tab-bar.tsx` — Mobile bottom tab bar
- `components/layout/app-topbar.tsx` — Search pill (palette trigger) + notifications bell
- `components/layout/section-header.tsx` — Reusable section header w/ eyebrow

### Feature components

- `components/search/` — Spotlight palette (palette dialog, trigger, recent storage, sections)
- `components/notifications/` — Bell, list (popover/page variants), row
- `components/movies/` — Movie cards, hero, rows, grid, detail page, search drawer (legacy)
- `components/series/` — TV-specific equivalents
- `components/watchlist/` — Library page content + cards
- `components/ai/` — Mood section + recommendations grid
- `components/landing/` — `landing-revamp.tsx` (marketing homepage)
- `components/legal/` — Shared `LegalLayout`
- `components/brand/` — Moodflix logo/icon
- `components/ui/` — shadcn/ui generated primitives (auto-generated, do not hand-edit)

### Data + hooks

- `drizzle/schema.ts` — Tables: `profiles`, `watchlist`, `ai_recommendations`, `notification_subscriptions`, `push_subscriptions`, `notifications`, `tmdb_media`, `tmdb_cache`, `top_hundred`
- `drizzle/index.ts` — Drizzle client (`prepare: false` for Supabase pooler)
- `drizzle/migrations/` — Generated SQL migrations
- `drizzle/rls-policies.sql` — RLS policies (apply manually in Supabase SQL Editor)
- `lib/supabase/{client,server,middleware}.ts` — Supabase clients
- `lib/supabase/api-auth.ts` — `getApiUser(request)`: bearer-token OR cookie auth for API routes (mobile + web)
- `lib/services/` — Shared business logic (watchlist, notifications) taking explicit `userId`; wrapped by both server actions (web) and REST routes (mobile)
- `lib/tmdb.ts` — TMDB API client (server-only, Bearer auth, 5min ISR cache)
- `lib/ai.ts` — Vercel AI SDK config
- `lib/web-push.ts` — Web Push helper
- `lib/rate-limit.ts` — LRU rate limiter (per-user daily buckets)
- `lib/constants.ts` — TMDB genre ID→name map
- `lib/country.ts` — Country detection from `x-vercel-ip-country`
- `hooks/use-movies.ts` — TMDB query hooks (search, trending, popular, top_rated, details, genre discover, infinite scroll)
- `hooks/use-search-multi.ts` — Multi-search (movies + TV) for palette
- `hooks/use-watchlist.ts` — Watchlist CRUD w/ optimistic updates
- `hooks/use-notifications.ts` — Inbox infinite query + unread count + mark mutations
- `hooks/use-push-subscription.ts` — Browser push subscription lifecycle
- `hooks/use-infinite-scroll.ts` — IntersectionObserver sentinel
- `actions/auth.ts` — Login, signup, OAuth, logout
- `actions/watchlist.ts` — Watchlist server actions
- `actions/notifications.ts` — Inbox list, count, mark read

### Types

- `types/movie.ts`, `types/tv.ts`, `types/media.ts` — TMDB types + `MultiSearchResult`
- `types/watchlist.ts` — Library types
- `types/notification.ts` — Inbox types
- `types/ai.ts`, `types/push.ts`, `types/auth.ts`

### Middleware

- `middleware.ts` — Next.js middleware (auth session refresh + route protection)

## Database Schema (high level)

All tables RLS-enabled. Key tables:

- `profiles` — Extends `auth.users` via trigger (`drizzle/seed.sql`)
- `watchlist` — User movies/TV w/ status + like/dislike rating (`1` / `-1` / `null`)
- `ai_recommendations` — Streaming chat history w/ JSONB metadata
- `notification_subscriptions` — Per-movie/TV release alert opt-ins
- `push_subscriptions` — Browser push device tokens
- `notifications` — Inbox rows (one per delivered release push); `notification_type` enum (`release`, `ai_event`, `system`)
- `tmdb_media`, `tmdb_cache` — TMDB metadata caching
- `top_hundred` — User's ranked top-100 list

**Manual setup on a fresh DB:** run `drizzle/seed.sql` (profile creation trigger) and `drizzle/rls-policies.sql` in the Supabase SQL Editor after `npm run db:migrate`.

## Planning Docs

- `docs/superpowers/specs/` — Design specs from the brainstorming skill
- `docs/superpowers/plans/` — Bite-sized implementation plans
