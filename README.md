# Moodflix

AI-powered movie & TV discovery app. Tell it your mood, get genre-aware recommendations streamed back, and curate a personal watchlist with status tracking and like/dislike ratings.

Built as a portfolio project to exercise modern full-stack patterns: streaming AI tool calls, RLS-secured Postgres via Drizzle, App Router server components, and a PWA-ready offline experience.

**Live:** _coming soon_

## Features

- **Mood-based AI recommendations** — natural-language prompt → Gemini streams genre suggestions via tool calls → TMDB discover renders matching titles with infinite scroll
- **Browse & search** — trending, popular, top-rated rows + genre filters, powered by TMDB with ISR caching
- **Netflix-style detail modal** — backdrop, cast, region-aware watch providers
- **Watchlist** — add/remove, status tracking (`want_to_watch` / `watching` / `watched`), like/dislike rating, optimistic updates
- **Auth** — email/password, Google OAuth, Passkey via Supabase Auth
- **PWA** — installable, offline page, service worker via Serwist, push notifications
- **Responsive shell** — hover-expand sidebar (desktop) + bottom tab bar (mobile), dark-only crimson theme

## Tech Stack

| Layer        | Stack                                                         |
| ------------ | ------------------------------------------------------------- |
| Framework    | Next.js 16 (App Router), React 19, TypeScript                 |
| Styling      | Tailwind CSS v4, shadcn/ui (new-york), Framer Motion          |
| Database     | Supabase Postgres + Row Level Security                        |
| ORM          | Drizzle ORM (postgres-js, transaction pooler)                 |
| Auth         | Supabase Auth (email, Google, Passkey)                        |
| AI           | Google Gemini via Vercel AI SDK v5 (streaming + tool calls)   |
| Data         | TanStack Query (client), Server Actions + `fetch` (server)    |
| Movie data   | TMDB API                                                      |
| Rate limit   | `lru-cache` (10 req/day per user)                             |
| Observability| Sentry, Vercel Speed Insights                                 |
| PWA          | Serwist + Web Push                                            |

## Architecture Highlights

- **Server-first data fetching** — TMDB rows rendered in Server Components with ISR; client hooks only for interactive surfaces (search, infinite scroll, watchlist mutations)
- **AI streaming with tools** — `/api/ai/recommend` uses `streamText` + `tool()` so the model emits structured `suggest_genres` calls the UI consumes mid-stream
- **Drizzle + RLS** — direct connection bypasses Supabase RLS, so every server action enforces `eq(userId, user.id)` explicitly
- **Optimistic watchlist** — TanStack Query mutations roll forward instantly, reconcile with server response, roll back on error
- **Region-aware watch providers** — country detected from `x-vercel-ip-country`, falls back to US
- **Type discipline** — zero `any`, all types live under `types/`, narrow `unknown` over loose typing

## Project Structure

```
app/
  (auth)/            login, signup, OAuth callback
  (app)/             protected shell — home, discover, series, library, settings
  api/movies/        TMDB proxy
  api/ai/recommend/  Streaming Gemini endpoint
actions/             Server actions (auth, watchlist)
components/          ui/, layout/, movies/, watchlist/, ai/
drizzle/             schema.ts, migrations/, rls-policies.sql
hooks/               TanStack Query hooks
lib/                 supabase clients, tmdb, ai, rate-limit, country
types/               Movie, Watchlist, Auth, AI types
```

## Local Development

```bash
npm install
npm run dev          # localhost:3000
npm run build        # prod build + typecheck
npm run lint
npm run db:generate  # generate migration from schema diff
npm run db:migrate   # apply migrations
npm run db:studio    # browse data
```

### Environment

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
SUPABASE_SECRET_KEY=
DATABASE_URL=           # transaction pooler (6543) — runtime
DATABASE_URL_DIRECT=    # session pooler (5432) — migrations
TMDB_API_READ_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
```

After first migration, run `drizzle/seed.sql` and `drizzle/rls-policies.sql` in the Supabase SQL Editor.

## Roadmap

- v0.2 Alpha Polish — shipped
- v0.3 Content Expansion (TV series, detail pages, sidebar nav) — shipped
- v0.4 Watchlist & Polish + PWA — shipped
- Next: notifications, social features, deployment

---

Built by [Yulius Kevin](https://github.com/yeka157).
