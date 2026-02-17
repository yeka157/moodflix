# Technology Stack

**Analysis Date:** 2026-02-17

## Languages

**Primary:**
- TypeScript 5 - All application code, strict mode enabled
- JavaScript - Configuration files (postcss.config.mjs, eslint.config.mjs)

**Secondary:**
- SQL - PostgreSQL migrations and queries via Drizzle ORM

## Runtime

**Environment:**
- Node.js (version not specified in .nvmrc or .node-version - uses default nvm)

**Package Manager:**
- npm - Lockfile present (package-lock.json)

## Frameworks

**Core:**
- Next.js 16.1.6 - App Router, React Server Components
- React 19.2.3 - UI rendering with Concurrent features

**UI & Styling:**
- Tailwind CSS v4 - Utility-first CSS with OKLCH color support
- shadcn/ui 3.8.4 - Component library (installed via CLI, new-york style)
- Lucide React 0.563.0 - Icon library

**Form & Validation:**
- React Hook Form 7.71.1 - Form state management
- Zod 4.3.6 - Schema validation

**Data Fetching & State:**
- TanStack Query (React Query) 5.90.20 - Server state, caching, synchronization
- Vercel AI SDK 6.0.82 - Streaming AI responses, tool calling
- @ai-sdk/react 3.0.84 - useChat hook for AI chat interface

**Database & ORM:**
- Drizzle ORM 0.45.1 - Type-safe SQL query builder
- Drizzle Kit 0.31.8 - Migration management
- postgres 3.4.8 - PostgreSQL client driver (native Node.js driver)

**Animations:**
- Framer Motion 12.33.0 - Advanced UI animations and transitions

**Utilities:**
- class-variance-authority 0.7.1 - Component variant pattern helper
- clsx 2.1.1 - Conditional className builder
- tailwind-merge 3.4.0 - Merge Tailwind classes without conflicts
- use-debounce 10.1.0 - Debouncing hook for search inputs
- react-infinite-scroll-hook 6.0.1 - Infinite scroll intersection observer
- lru-cache 11.2.6 - In-memory rate limiting cache
- next-themes 0.4.6 - Theme management (not actively used - always dark mode)
- sonner 2.0.7 - Toast notifications

**Build & Development:**
- @tailwindcss/postcss 4 - PostCSS plugin for Tailwind v4
- ESLint 9 - Code linting with Next.js and TypeScript configs
- TypeScript 5 - Type checking (strict: true)
- tw-animate-css 1.4.0 - CSS animation utilities for Tailwind

## Key Dependencies

**Critical:**
- drizzle-orm & drizzle-kit - All database operations and migrations
- @supabase/ssr & @supabase/supabase-js - Authentication and session management
- @ai-sdk/google - Gemini integration for mood recommendations
- postgres - Direct PostgreSQL connection (not libpq wrapper)

**Infrastructure:**
- zod - Runtime schema validation for forms and API inputs
- react-hook-form - Form state without extra rerenders
- @tanstack/react-query - Server state management with built-in caching
- framer-motion - Smooth animations (hero banner, card hovers, transitions)

## Configuration

**Environment:**
Environment variables required (`.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Supabase anon key
- `SUPABASE_SECRET_KEY` - Supabase service role key
- `DATABASE_URL` - PostgreSQL transaction pooler (port 6543, runtime queries)
- `DATABASE_URL_DIRECT` - PostgreSQL session pooler (port 5432, Drizzle Kit migrations only)
- `TMDB_API_KEY` - TMDB API key for legacy endpoints
- `TMDB_API_READ_KEY` - TMDB Bearer token (preferred for v4 API)
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google Generative AI / Gemini API key

**Build:**
- `tsconfig.json` - ES2017 target, strict mode, path alias `@/*` → root
- `drizzle.config.ts` - Dialect: PostgreSQL, schema: `drizzle/schema.ts`, migrations: `drizzle/migrations/`
- `next.config.ts` - Remote image patterns (image.tmdb.org), security headers
- `postcss.config.mjs` - @tailwindcss/postcss plugin
- `eslint.config.mjs` - eslint-config-next (core-web-vitals + typescript)

**Next.js Features:**
- Image optimization enabled (TMDB poster/backdrop CDN)
- App Router with layout nesting
- Server Components default
- Middleware for auth session refresh and route protection
- ISR (Incremental Static Revalidation) for TMDB caching (5 min)

## Platform Requirements

**Development:**
- Node.js (any recent LTS version, tested on latest)
- npm (included with Node.js)
- PostgreSQL database (Supabase or self-hosted)
- Supabase project with Auth enabled

**Production:**
- Vercel (Next.js deployment, security headers configured)
- Supabase instance (PostgreSQL backend)
- Environment variables for all external APIs configured at deployment

---

*Stack analysis: 2026-02-17*
