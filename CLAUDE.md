# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Moodflix** - A movie watchlist and recommendation SaaS with AI-powered mood-based discovery. Currently in early development (scaffolded from create-next-app, not yet built out).

## Tech Stack

| Layer         | Technology                                                      |
| ------------- | --------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router), React 19, TypeScript                   |
| Styling       | Tailwind CSS v4, shadcn/ui                                      |
| Database      | Supabase (PostgreSQL) with Row Level Security                   |
| ORM           | Drizzle ORM with postgres-js driver                            |
| Auth          | Supabase Auth (email/password, Google OAuth, Passkey)           |
| AI            | Google Gemini via Vercel AI SDK                                 |
| AI UI         | prompt-kit (shadcn/ui-based AI components)                      |
| Data Fetching | TanStack Query (client), Next.js fetch (server)                 |
| Movie Data    | TMDB API                                                        |
| Rate Limiting | lru-cache (in-memory)                                           |

## Commands

```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build (also validates TypeScript)
npm run lint         # ESLint with next/core-web-vitals + typescript configs
npm run db:generate  # Generate SQL migration files from schema changes
npm run db:migrate   # Apply pending migrations to the database
npm run db:push      # Push schema directly (prototyping only)
npm run db:studio    # Open Drizzle Studio to browse/edit data
```

See [DRIZZLE_GUIDE.md](./DRIZZLE_GUIDE.md) for the full migration workflow.

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
SUPABASE_SECRET_KEY=
DATABASE_URL=           # Supabase transaction pooler (port 6543) for runtime
DATABASE_URL_DIRECT=    # Supabase session pooler (port 5432) for Drizzle Kit migrations
TMDB_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
```

## Architecture

### Planned Route Structure (App Router)

- `app/page.tsx` - Landing page
- `app/(auth)/login|signup` - Auth pages (no shared layout nesting)
- `app/(app)/` - Protected area with shared navbar layout
  - `home/page.tsx` - Home (welcome + AI mood section + feature nav)
  - `discover/` - Browse/search movies via TMDB
  - `watchlist/` - User's personal watchlist
- `app/api/movies/` - TMDB proxy routes
- `app/api/ai/recommend/` - AI recommendation endpoint (rate-limited)

### Key Directories

- `drizzle/schema.ts` - Drizzle table definitions (profiles, watchlist, ai_recommendations)
- `drizzle/index.ts` - Drizzle client (uses `DATABASE_URL` pooler with `prepare: false`)
- `drizzle/migrations/` - Generated SQL migrations (managed by Drizzle Kit)
- `drizzle/seed.sql` - Profile trigger SQL (run manually in Supabase Dashboard)
- `drizzle/rls-policies.sql` - RLS policies SQL (run manually in Supabase Dashboard)
- `components/ui/` - shadcn/ui components (auto-generated)
- `components/landing/` - Landing page components
- `components/movies/`, `components/watchlist/`, `components/ai/` - Feature components
- `components/layout/` - Navbar, sidebar, footer
- `lib/supabase/` - Supabase clients (`client.ts` for browser, `server.ts` for server, `middleware.ts`)
- `lib/tmdb.ts` - TMDB API client
- `lib/ai.ts` - Vercel AI SDK config
- `hooks/use-movies.ts` - Movie search/trending/popular/details hooks
- `hooks/use-watchlist.ts` - Watchlist CRUD hooks with optimistic updates
- `types/movie.ts` - TMDB movie types
- `types/watchlist.ts` - Watchlist types (WatchlistItem, WatchlistStatus, etc.)
- `actions/auth.ts` - Auth server actions (login, signup, logout)
- `actions/watchlist.ts` - Watchlist server actions (add, remove, update status, rate)
- `middleware.ts` - Next.js middleware for auth session refresh + route protection

**Note:** There is no `supabase/` root folder. Supabase CLI is not used — Drizzle Kit handles migrations, RLS is managed via Supabase Dashboard.

### Path Alias

`@/*` maps to project root (e.g., `@/components/ui/button`, `@/lib/utils`, `@/types`).

## Package Management

### shadcn/ui Components

Always use the shadcn CLI to add UI components — never install their underlying packages manually:

```bash
npx shadcn@latest add button    # Adds button component + auto-installs deps
npx shadcn@latest add sonner    # Adds toast/sonner component
```

shadcn/ui `init` and `add` commands automatically install required peer dependencies (`lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`, etc.). Only use `npm install` directly for packages that are NOT part of the shadcn/ui ecosystem (e.g., `framer-motion`, `drizzle-orm`, `@tanstack/react-query`).

### prompt-kit (AI UI Components)

Use [prompt-kit](https://prompt-kit.com) for all AI-related UI components (mood input, chat, recommendations, streaming responses). It builds on shadcn/ui and installs via the same CLI pattern:

```bash
npx shadcn@latest add "https://prompt-kit.com/c/prompt-input.json"
npx shadcn@latest add "https://prompt-kit.com/c/message.json"
npx shadcn@latest add "https://prompt-kit.com/c/markdown.json"
```

Available components: Prompt Input, Message, Markdown, Chat Container, Code Block, Feedback, File Upload, Loader, Prompt Suggestion, Reasoning, Chain of Thought, Scroll Button, Source, Steps, Image.

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

## Notion Documentation

This project's documentation is mirrored to a Notion workspace page. After completing a phase or making significant project-level changes (route structure, tech stack, architecture), update the Notion page to stay in sync.

- **Main page:** `3022b505-590c-80b8-8159-c1591b5c24e1`
- **To Do page:** `3022b505-590c-8082-b0b6-c227a0bd65a1`

What to sync: Project Status table, Key Directories, Route Structure, and any new sections relevant to completed work. Keep updates concise — project-scope, not plan-scope.

## Git Conventions

- Commit messages: `feat:`, `fix:`, `style:`, `refactor:`, `docs:`
- Branch names: `feature/`, `fix/`, `refactor/`
