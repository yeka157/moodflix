# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CineList** - A movie watchlist and recommendation SaaS with AI-powered mood-based discovery. Currently in early development (scaffolded from create-next-app, not yet built out).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui |
| Database | Supabase (PostgreSQL) with Row Level Security |
| Auth | Supabase Auth (email/password, Google OAuth, Apple ID, Passkey) |
| AI | Google Gemini via Vercel AI SDK |
| Data Fetching | TanStack Query (client), Next.js fetch (server) |
| Movie Data | TMDB API |
| Rate Limiting | lru-cache (in-memory) |

## Commands

```bash
npm run dev      # Start dev server on localhost:3000
npm run build    # Production build (also validates TypeScript)
npm run lint     # ESLint with next/core-web-vitals + typescript configs
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TMDB_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
```

## Architecture

### Planned Route Structure (App Router)

- `app/page.tsx` - Landing page
- `app/(auth)/login|signup` - Auth pages (no shared layout nesting)
- `app/(dashboard)/` - Protected area with shared sidebar/navbar layout
  - `page.tsx` - Dashboard home
  - `discover/` - Browse/search movies via TMDB
  - `watchlist/` - User's personal watchlist
  - `ai/` - Mood-based AI recommendations
- `app/api/movies/` - TMDB proxy routes
- `app/api/ai/recommend/` - AI recommendation endpoint (rate-limited)

### Key Directories

- `components/ui/` - shadcn/ui components (auto-generated)
- `components/movies/`, `components/watchlist/`, `components/ai/` - Feature components
- `components/layout/` - Navbar, sidebar, footer
- `lib/supabase/` - Supabase clients (`client.ts` for browser, `server.ts` for server)
- `lib/tmdb.ts` - TMDB API client
- `lib/ai.ts` - Vercel AI SDK config
- `hooks/` - All TanStack Query hooks (`use-movies.ts`, `use-watchlist.ts`, `use-ai.ts`, `use-auth.ts`)
- `types/` - All TypeScript types (centralized)
- `actions/` - Server Actions for mutations

### Path Alias

`@/*` maps to project root (e.g., `@/components/ui/button`, `@/lib/utils`, `@/types`).

## Strict Conventions

### TypeScript

- **Zero `any`** - use `unknown` and narrow instead
- **All types in `types/` folder** - never define interfaces/types in component or hook files
- Import types via `import type { Movie } from "@/types"`

### Data Fetching

- **All client-side API calls must live in custom hooks** under `hooks/` using TanStack Query
- Server Components use direct `fetch()` or server actions
- Mutations use either Server Actions or TanStack Query `useMutation` with optimistic updates

### Components

- File naming: kebab-case (`movie-card.tsx`)
- Export naming: PascalCase (`MovieCard`)
- Prefer function declarations over arrow for components
- Use `cn()` utility for conditional Tailwind classes
- Import order: external libs → internal modules → types → styles

### UI Requirements

- Every async operation must have a loading state (Skeleton for layouts, Spinner for actions)
- All interactive elements need hover, focus-visible, active, and disabled states
- Empty states must include helpful messaging and a call-to-action
- Minimum 44x44px touch targets on mobile
- Respect `prefers-reduced-motion`
- All search inputs must use debounce (300ms, `use-debounce` library)
- All forms must use Zod validation with react-hook-form

### AI Endpoints

- All AI routes require authentication
- Rate limiting mandatory: 10 requests/day (free), 100/day (premium)
- Max input: 500 chars; max output tokens: 1000
- Return `Retry-After` header on 429 responses

### Animations

- Use Framer Motion (not GSAP) for UI animations
- Use CSS transitions for simple hover/focus effects

## Database Schema

Three tables with RLS enabled: `profiles` (extends auth.users), `watchlist` (movies with status/rating), `ai_recommendations` (prompt + JSONB results). Watchlist status enum: `want_to_watch`, `watching`, `watched`.

## Git Conventions

- Commit messages: `feat:`, `fix:`, `style:`, `refactor:`, `docs:`
- Branch names: `feature/`, `fix/`, `refactor/`
