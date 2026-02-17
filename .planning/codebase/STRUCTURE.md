# Codebase Structure

**Analysis Date:** 2026-02-17

## Directory Layout

```
moodflix/
├── app/                    # Next.js App Router pages & API routes
│   ├── page.tsx           # Landing page (public)
│   ├── layout.tsx         # Root layout (fonts, metadata, Toaster)
│   ├── robots.ts          # SEO robots.txt
│   ├── sitemap.ts         # SEO sitemap
│   ├── manifest.ts        # PWA manifest
│   ├── (auth)/            # Auth route group (no shared layout)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts
│   ├── (app)/             # Protected area (requires auth)
│   │   ├── layout.tsx     # Auth guard + navbar + providers
│   │   ├── home/
│   │   │   ├── page.tsx
│   │   │   ├── error.tsx
│   │   │   ├── loading.tsx
│   │   │   └── recommendations/
│   │   │       ├── page.tsx
│   │   │       └── loading.tsx
│   │   ├── discover/
│   │   │   ├── page.tsx
│   │   │   ├── error.tsx
│   │   │   └── loading.tsx
│   │   └── watchlist/
│   │       ├── page.tsx
│   │       ├── error.tsx
│   │       └── loading.tsx
│   └── api/               # API routes (server endpoints)
│       ├── movies/
│       │   ├── route.ts   # GET /api/movies?query|category|genre|page=
│       │   └── [id]/
│       │       ├── route.ts      # GET /api/movies/[id]
│       │       └── recommendations/
│       │           └── route.ts  # GET /api/movies/[id]/recommendations
│       └── ai/
│           └── recommend/
│               └── route.ts  # POST /api/ai/recommend (streaming)
├── components/            # React components
│   ├── landing/          # Landing page sections (server)
│   │   ├── landing-navbar.tsx
│   │   ├── hero-section.tsx
│   │   ├── features-section.tsx
│   │   ├── movie-showcase.tsx
│   │   ├── ai-preview-section.tsx
│   │   ├── cta-section.tsx
│   │   └── footer.tsx
│   ├── auth/             # Auth forms (client)
│   │   ├── login-form.tsx
│   │   └── signup-form.tsx
│   ├── layout/           # Shared layout components
│   │   ├── app-navbar.tsx      # Top navbar (Home, Discover, Watchlist)
│   │   └── feature-card-grid.tsx # Animated feature cards
│   ├── movies/           # Movie discovery & detail components
│   │   ├── hero-banner.tsx     # Full-width trending hero
│   │   ├── movie-card.tsx      # Single movie card (reusable)
│   │   ├── movie-card-skeleton.tsx
│   │   ├── movie-row.tsx       # Horizontal scrollable row
│   │   ├── movie-grid.tsx      # Responsive grid with infinite scroll
│   │   ├── movie-detail-modal.tsx # Full movie details dialog
│   │   ├── home-movies.tsx     # Client wrapper for home (modal state)
│   │   ├── discover-content.tsx # Client discover UI (search + filters)
│   │   └── personalized-section.tsx # "Because you liked" rows
│   ├── watchlist/        # Watchlist management components
│   │   ├── watchlist-content.tsx # Tabs, grid, empty state
│   │   ├── watchlist-card.tsx    # Single watchlist item card
│   │   └── watchlist-skeleton.tsx
│   ├── ai/               # AI mood chat components
│   │   ├── mood-section.tsx      # Chat interface + mood input
│   │   └── recommendations-grid.tsx # Infinite scroll grid by genre
│   ├── ui/               # shadcn/ui & custom UI primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── tabs.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── tooltip.tsx
│   │   ├── scroll-area.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   ├── loader.tsx           # prompt-kit loader (dots, typing, shimmer)
│   │   ├── prompt-input.tsx     # prompt-kit AI input (manually ported)
│   │   ├── prompt-suggestion.tsx # prompt-kit suggestion chip
│   │   ├── sonner.tsx           # Toast provider
│   │   ├── label.tsx
│   │   ├── textarea.tsx
│   │   ├── toggle.tsx
│   │   ├── toggle-group.tsx
│   │   └── [other shadcn/ui components]
│   └── providers.tsx     # QueryClientProvider + TooltipProvider
├── drizzle/              # Drizzle ORM
│   ├── index.ts          # Drizzle client instance (DATABASE_URL pooler)
│   ├── schema.ts         # Table definitions (profiles, watchlist, aiRecommendations)
│   ├── migrations/       # Generated SQL files (auto-created by Drizzle Kit)
│   ├── seed.sql          # Profile creation trigger (run manually)
│   └── rls-policies.sql  # Row-level security policies (run manually)
├── lib/                  # Utility libraries & clients
│   ├── supabase/
│   │   ├── client.ts     # Browser Supabase client (auth only)
│   │   ├── server.ts     # Server Supabase client (auth only)
│   │   └── middleware.ts # [Not implemented] Auth session refresh
│   ├── tmdb.ts           # TMDB API client (server-only, ISR cached)
│   ├── ai.ts             # Gemini model instance
│   ├── rate-limit.ts     # LRU-based rate limiter (10 req/day)
│   ├── recommendations.ts # Personalization logic (genre frequency)
│   ├── country.ts        # Country detection from Vercel headers
│   ├── constants.ts      # TMDB genre map, mood messages by genre
│   ├── query-client.ts   # TanStack QueryClient factory
│   ├── utils.ts          # cn() utility, getPosterUrl(), etc.
│   └── globals.css       # Tailwind globals + custom animations
├── hooks/                # Custom React hooks (client-side)
│   ├── use-movies.ts     # TanStack Query wrappers for TMDB proxy
│   │                     # (useTrendingMovies, useMovieSearch, useDiscoverByGenre, etc.)
│   ├── use-watchlist.ts  # TanStack Query wrappers for watchlist
│   │                     # (useWatchlist, useWatchlistTmdbIds, useAddToWatchlist, etc.)
│   └── use-ai.ts         # useChat wrapper with genre extraction
├── actions/              # Next.js Server Actions
│   ├── auth.ts           # login(), signup(), loginWithGoogle(), logout()
│   └── watchlist.ts      # getWatchlist(), addToWatchlist(), removeFromWatchlist(),
│                         # updateWatchlistStatus(), rateWatchlistItem(), etc.
├── types/                # TypeScript type definitions
│   ├── movie.ts          # TMDB types (Movie, MovieDetails, WatchProvider, etc.)
│   ├── watchlist.ts      # WatchlistItem, WatchlistStatus, mutations
│   ├── auth.ts           # Auth form types
│   └── ai.ts             # GenreSuggestion type
├── public/               # Static assets
│   ├── favicon-*.png     # Favicon variants
│   ├── apple-touch-icon.png
│   ├── og-image.png      # Open Graph image
│   ├── twitter-image.png
│   ├── placeholder-poster.svg  # Fallback poster image
│   ├── placeholder-backdrop.svg # Fallback backdrop image
│   └── site.webmanifest  # PWA manifest
├── .planning/            # GSD internal planning docs
│   └── codebase/
│       ├── ARCHITECTURE.md # (this file)
│       ├── STRUCTURE.md    # (this file)
│       └── [other analysis docs]
├── drizzle.config.ts     # Drizzle Kit configuration
├── next.config.ts        # Next.js configuration (Image optimization)
├── middleware.ts         # [Planned] Auth session refresh & redirects
├── tsconfig.json         # TypeScript configuration (@/* paths)
├── package.json          # Dependencies & scripts
├── package-lock.json     # Locked versions
└── .env.local            # [Not committed] Environment variables
```

## Directory Purposes

**app/**
- Purpose: Next.js App Router source (pages, API routes, layouts)
- Contains: Route pages (`.tsx`), API handlers (`.ts`), error/loading boundaries
- Key files: `page.tsx` (entry point per route), `layout.tsx` (shared structure), `route.ts` (API handlers)

**components/**
- Purpose: React components organized by feature area
- Contains: Functional components with JSX, some Client Components ("use client" pragma)
- Key files: Largest are `movie-detail-modal.tsx`, `watchlist-content.tsx`, `discover-content.tsx`

**drizzle/**
- Purpose: Database schema, client, migrations, and SQL setup
- Contains: Drizzle ORM definitions, generated migration files, manual setup SQL
- Key files: `schema.ts` (table definitions), `index.ts` (client instance), `migrations/` (auto-generated)

**lib/**
- Purpose: Reusable utilities, external API clients, and configuration
- Contains: Pure functions, client instances, constants
- Key files: `tmdb.ts` (TMDB API), `supabase/` (auth clients), `rate-limit.ts` (LRU), `recommendations.ts` (personalization logic)

**hooks/**
- Purpose: Custom React hooks for data fetching and state management
- Contains: TanStack Query wrappers, AI SDK hooks
- Key files: `use-movies.ts` (20+ hook exports), `use-watchlist.ts` (mutation hooks), `use-ai.ts` (chat hook)

**actions/**
- Purpose: Next.js Server Actions for mutations and auth
- Contains: `"use server"` functions that run server-side
- Key files: `auth.ts` (login/signup), `watchlist.ts` (CRUD operations)

**types/**
- Purpose: Centralized TypeScript definitions
- Contains: Type definitions (no implementation), enums, type unions
- Key files: `movie.ts` (TMDB API types), `watchlist.ts` (domain types)

**public/**
- Purpose: Static assets served directly
- Contains: Images (favicon, OG, fallbacks), manifest
- Key files: `placeholder-*.svg` (fallbacks when TMDB poster/backdrop missing)

## Key File Locations

**Entry Points:**
- `app/page.tsx` - Landing page (public, no auth required)
- `app/(app)/home/page.tsx` - Home dashboard (SSR with trending + personalized data)
- `app/(auth)/login/page.tsx` - Login form
- `app/(auth)/callback/route.ts` - OAuth callback handler

**Configuration:**
- `drizzle.config.ts` - Drizzle Kit settings (schema, migrations, env loading)
- `next.config.ts` - Next.js settings (image domains, etc.)
- `tsconfig.json` - TypeScript paths (@ → project root)
- `components.json` - shadcn/ui config (new-york style, lucide icons, @/ paths)
- `.env.local` - Environment variables (not committed, add to .gitignore)

**Core Logic:**
- `drizzle/schema.ts` - Database tables (profiles, watchlist, aiRecommendations)
- `lib/tmdb.ts` - TMDB API client with ISR caching
- `lib/recommendations.ts` - Personalization algorithm (genre frequency from watchlist)
- `lib/rate-limit.ts` - AI request rate limiting
- `actions/watchlist.ts` - Watchlist mutations with auth checks
- `app/api/ai/recommend/route.ts` - AI streaming endpoint with tool calling

**Testing:**
- No test files present (testing patterns would follow Jest/Vitest)

## Naming Conventions

**Files:**
- Components: kebab-case (`movie-card.tsx`, `app-navbar.tsx`)
- API routes: lowercase (`route.ts`), dynamic segments in brackets (`[id]`)
- Pages: `page.tsx` per route, `layout.tsx` per directory, `loading.tsx` and `error.tsx` for boundaries
- Utilities: kebab-case matching export name (`use-movies.ts` exports `useMovies`)

**Directories:**
- Feature areas: lowercase plural or singular (`components`, `hooks`, `actions`, `types`)
- Route groups: parentheses (`(app)`, `(auth)`) to group without adding to URL
- Dynamic segments: brackets (`[id]`) for runtime parameters

**Exports:**
- Components: PascalCase (`MovieCard`, `AppNavbar`)
- Hooks: camelCase with `use` prefix (`useMovies`, `useWatchlist`)
- Functions: camelCase (`getTrendingMovies`, `addToWatchlist`)
- Constants: UPPER_SNAKE_CASE (`GENRES`, `GENRE_MOOD_MESSAGES`)
- Types: PascalCase (`Movie`, `WatchlistItem`)

**Classes/Objects:**
- Type definitions: PascalCase (`MovieListResponse`, `WatchlistStatus`)
- Enums: Not used (string literals instead, e.g., `watchlistStatusEnum` for DB)

## Where to Add New Code

**New Feature (e.g., Collections):**
- Primary code: `app/(app)/collections/` for pages, `components/collections/` for components
- Types: `types/collection.ts`
- Data: `drizzle/schema.ts` (new table) + `actions/collections.ts` (mutations)
- Hooks: `hooks/use-collections.ts` (TanStack Query wrappers)
- API: `app/api/collections/route.ts` if needed (usually not — use server actions)
- Tests: `__tests__/collections.test.ts` (structure not yet in codebase)

**New Component/Module:**
- Implementation: `components/[feature]/[component-name].tsx`
- Export: as default export (e.g., `export function ComponentName(...)`)
- Import in parent: `import { ComponentName } from "@/components/[feature]/[component-name]"`
- If component uses hooks: add hooks to `hooks/use-[feature].ts`
- If component is reusable: consider if it belongs in `components/ui/` instead

**Utilities:**
- Shared helpers: `lib/utils.ts`
- Domain-specific: `lib/[domain].ts` (e.g., `lib/recommendations.ts`, `lib/rate-limit.ts`)
- Hooks (client): `hooks/use-[feature].ts`
- Server functions: `actions/[feature].ts`

**Styling:**
- Component styles: Inline Tailwind classes using `cn()` utility
- Global styles: `lib/globals.css` for animations and CSS keyframes
- Theme: Dark-only, crimson accent (`oklch(0.637 0.237 25.331)`), Inter font
- Tailwind v4 color format: OKLCH (not HSL)

**Types:**
- Always in `types/` folder, never in component/hook files
- One type file per domain (`types/movie.ts`, `types/watchlist.ts`)
- Export all related types from single file
- Use `import type { Movie }` syntax for type imports

**API Routes:**
- Public endpoints: `app/api/[domain]/route.ts`
- Proxy to external API: fetch in handler, return JSON
- Private endpoints: Check auth first, return 401 if missing
- Streaming: Use `streamText()` from AI SDK, return `.toUIMessageStreamResponse()`

## Special Directories

**drizzle/migrations/**
- Purpose: Generated SQL migration files
- Generated: Automatically by Drizzle Kit (`npm run db:generate`)
- Committed: Yes, so other developers can apply them
- Manual: Run via `npm run db:migrate` to apply pending migrations
- Schema source: `drizzle/schema.ts`

**drizzle/seed.sql** & **drizzle/rls-policies.sql**
- Purpose: Setup scripts for profiles trigger and row-level security
- Generated: No, written manually
- Committed: Yes, for reference
- Manual: Must be run in Supabase SQL Editor after initial migration
- Why separate: Drizzle Kit doesn't support triggers or RLS definitions yet

**.planning/codebase/**
- Purpose: GSD internal analysis documents (architecture, structure, conventions, etc.)
- Generated: By `/gsd:map-codebase` command
- Committed: Yes, reference for future planning
- Not used by: Application code (for documentation only)

**.next/**
- Purpose: Build output and cache
- Generated: Automatically during `npm run build`
- Committed: No (in .gitignore)
- Contains: Compiled pages, server components, static files

**node_modules/**
- Purpose: Installed dependencies
- Generated: By `npm install`
- Committed: No (in .gitignore)
- Not modified manually: Use `npm` CLI only

**public/**
- Purpose: Static assets served at root URL
- Generated: No, checked in
- Committed: Yes
- URL mapping: `/favicon-32x32.png` served as `https://moodflix.app/favicon-32x32.png`

