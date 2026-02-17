# Architecture

**Analysis Date:** 2026-02-17

## Pattern Overview

**Overall:** Next.js App Router with Server Components, API Routes, and Client Components layered by concern

**Key Characteristics:**
- Server-first data fetching (SSR for home/discover/watchlist, client fetching via TanStack Query for dynamic content)
- Separation of auth flow (landing), protected app (home/discover/watchlist), and API routes
- Drizzle ORM with Supabase as the single database source of truth
- TMDB as external movie data service with ISR caching
- AI-powered recommendations via Gemini with tool calling for genre suggestions
- TanStack Query for client-side caching and mutations with optimistic updates
- Server Actions for state mutations (auth, watchlist changes)

## Layers

**Landing & Auth Layer:**
- Purpose: Public-facing pages for unauthenticated users
- Location: `app/page.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`, `app/(auth)/callback/route.ts`
- Contains: Landing page sections (hero, features, showcase, AI preview, CTA, footer), auth forms
- Depends on: Supabase auth client (`lib/supabase/client.ts`), server actions (`actions/auth.ts`)
- Used by: Unauthenticated visitors

**Protected App Layer:**
- Purpose: Authenticated user experience (home, discover, watchlist)
- Location: `app/(app)/layout.tsx`, `app/(app)/home/page.tsx`, `app/(app)/discover/page.tsx`, `app/(app)/watchlist/page.tsx`
- Contains: Route pages (SSR server components), error and loading boundaries, main navbar layout
- Depends on: Supabase auth (redirect if not authenticated), TMDB service, Drizzle for personalization, TanStack Query for client hydration
- Used by: Authenticated users

**API Integration Layer:**
- Purpose: Server-side proxying, streaming, and specialized endpoints
- Location: `app/api/`
- Contains:
  - `app/api/movies/route.ts` - TMDB proxy (search, trending, popular, top_rated, genre discovery)
  - `app/api/movies/[id]/route.ts` - Movie details + regional watch providers
  - `app/api/movies/[id]/recommendations/route.ts` - Movie-based recommendations
  - `app/api/ai/recommend/route.ts` - Streaming AI mood chat with tool calling
- Depends on: TMDB client, Gemini model, Supabase auth, rate limiting, Drizzle for DB
- Used by: Frontend components via fetch/TanStack Query

**Component Layer (Server + Client):**
- Purpose: Render UI using Server Components for data fetching, Client Components for interactivity
- Location: `components/`
- Structure:
  - `components/landing/` - Landing page sections (all Server Components)
  - `components/auth/` - Auth forms (Client Components with react-hook-form)
  - `components/movies/` - Movie discovery UI (mixed Server/Client; MovieCard, MovieGrid, MovieDetailModal are Client)
  - `components/watchlist/` - Watchlist management (Client Components with TanStack Query mutations)
  - `components/ai/` - AI mood chat and recommendations (Client Components using useChat hook)
  - `components/layout/` - Shared layout (AppNavbar is Client, FeatureCardGrid with animations)
  - `components/ui/` - shadcn/ui primitives + prompt-kit custom components
- Depends on: Types, hooks, actions, TMDB, Supabase client
- Used by: Pages and other components

**Data Access Layer:**
- Purpose: Encapsulate data fetching and mutations
- Location: `actions/`, `hooks/`
- Actions (Server Actions at `actions/auth.ts`, `actions/watchlist.ts`):
  - `login()`, `signup()`, `loginWithGoogle()`, `logout()` - Auth mutations (redirects)
  - `getWatchlist()`, `addToWatchlist()`, `removeFromWatchlist()`, `updateWatchlistStatus()`, `rateWatchlistItem()` - Watchlist CRUD with Drizzle
  - All include auth checks via `getAuthUserId()` + revalidation
- Hooks (Client hooks at `hooks/use-*.ts`):
  - `useMovies()`, `useTrendingMovies()`, `usePopularMovies()`, etc. - TanStack Query wrappers around `/api/movies`
  - `useWatchlist()`, `useWatchlistTmdbIds()`, `useAddToWatchlist()` - TanStack Query + optimistic updates
  - `useMoodChat()` - AI SDK `useChat` wrapper with genre extraction
- Depends on: Drizzle, Supabase, external APIs (TMDB, AI SDK)
- Used by: Components, pages

**Library Layer:**
- Purpose: Utilities, clients, and configuration
- Location: `lib/`
- Key exports:
  - `lib/supabase/client.ts` - Browser Supabase client (auth only)
  - `lib/supabase/server.ts` - Server Supabase client (auth only)
  - `lib/tmdb.ts` - TMDB API client (server-only, ISR-cached)
  - `lib/ai.ts` - Gemini model instance
  - `lib/rate-limit.ts` - LRU-based in-memory rate limiter (10 req/day per user)
  - `lib/recommendations.ts` - Personalization logic (genre frequency from watchlist)
  - `lib/country.ts` - Country detection from Vercel headers
  - `lib/constants.ts` - TMDB genre map, mood messages by genre
  - `lib/query-client.ts` - TanStack QueryClient factory
  - `lib/utils.ts` - cn() utility, getPosterUrl()
- Depends on: External SDKs, environment vars
- Used by: All layers

**Database Layer:**
- Purpose: Schema definition and ORM configuration
- Location: `drizzle/`
- Schema at `drizzle/schema.ts`:
  - `profiles` (extends Supabase auth.users via UUID PK)
  - `watchlist` (movies with status, rating, timestamps; unique constraint on (userId, tmdbId))
  - `aiRecommendations` (prompt + JSONB results for analytics)
- Client at `drizzle/index.ts`:
  - Postgres.js driver with `prepare: false` (Supabase pooler compatibility)
  - Uses transaction pooler (port 6543) via `DATABASE_URL`
- Migrations at `drizzle/migrations/` (generated by Drizzle Kit)
- Depends on: Supabase PostgreSQL
- Used by: Server Actions, API routes, recommendation logic

**Type Layer:**
- Purpose: Centralized TypeScript definitions
- Location: `types/`
- Exports:
  - `types/movie.ts` - TMDB types (Movie, MovieDetails, WatchProvider, MovieCredits, MovieDetailsResponse)
  - `types/watchlist.ts` - WatchlistItem, WatchlistStatus, mutations (AddToWatchlistInput, WatchlistActionResult)
  - `types/auth.ts` - Auth form types
  - `types/ai.ts` - GenreSuggestion
- Used by: All layers

## Data Flow

**Authentication Flow:**

1. Visitor lands on `/` (public landing page)
2. User clicks "Sign Up" → fills form → calls `signup()` server action
3. `signup()` calls Supabase auth (`signUp()`) → redirects to `/home` on success
4. `app/(app)/layout.tsx` checks auth via `supabase.auth.getUser()` → redirects to `/login` if unauthenticated
5. OAuth: User clicks "Login with Google" → `loginWithGoogle()` opens OAuth flow → redirects to `/callback` → creates session → redirects to `/home`

**Movie Discovery Flow:**

1. User navigates to `/discover`
2. `app/(app)/discover/page.tsx` (Server Component) fetches trending/popular/top_rated via TMDB API with ISR caching (5min)
3. Renders `DiscoverContent` (Client Component) which manages search state + filters
4. User types in search → `useMovieSearch()` queries `/api/movies?query=...` after 300ms debounce
5. User selects genre filter → `useDiscoverByGenre()` queries `/api/movies?genre=...` with infinite scroll
6. `/api/movies/route.ts` proxies TMDB endpoint (Bearer token auth, no caching for dynamic queries)
7. User clicks movie card → fetches details via `useMovieDetails()` → renders `MovieDetailModal`
8. Modal shows cast, watch providers, and "Add to Watchlist" button
9. User clicks bookmark → `useAddToWatchlist()` mutation → server action `addToWatchlist()` → Drizzle INSERT + revalidate

**Watchlist Management Flow:**

1. User navigates to `/watchlist`
2. `app/(app)/watchlist/page.tsx` (Server Component) renders `WatchlistContent` (Client Component)
3. `useWatchlist()` fetches user's watchlist via server action `getWatchlist()` (filters by status)
4. User clicks status dropdown → `useUpdateWatchlistStatus()` mutation → server action updates in Drizzle + revalidates
5. User clicks like/dislike → `useRateWatchlistItem()` mutation → server action sets rating (1 or -1) + revalidates
6. User clicks remove → `useRemoveFromWatchlist()` mutation with optimistic update → server action deletes + revalidates

**AI Mood Chat Flow:**

1. User navigates to `/home` → `MoodSection` renders AI chat interface
2. User types mood message (e.g., "I'm feeling sad") → `useMoodChat()` via `DefaultChatTransport` POSTs to `/api/ai/recommend`
3. `/api/ai/recommend/route.ts`:
   - Checks auth → checks rate limit (10 req/day) → gets watchlist context (top 5 liked movies)
   - Calls Gemini with system prompt + user message + `suggest_genres` tool
   - Gemini streams response (max 3 steps, 1000 tokens)
   - When Gemini calls `suggest_genres` tool, executes callback to store in `aiRecommendations` table
   - Returns streaming UI message response
4. Chat extracts `GenreSuggestion` from tool output via `extractLatestGenreSuggestion()`
5. If genres extracted, renders "View Recommendations" button linking to `/home/recommendations?genres=...`
6. `/home/recommendations/page.tsx` (Server Component) calls `useDiscoverByGenre()` → renders infinite scroll grid

**Personalization Flow:**

1. User with watchlist lands on `/home`
2. `getPersonalizedData(userId)` in server component:
   - Fetches top 5 liked movies from watchlist (excluding disliked)
   - Fetches TMDB details for top 3 to extract genres
   - Computes genre frequency → selects top genre
   - Returns mood message (deterministic per user/genre) + source movies for "Because you liked" rows
3. Passes data to `HomeMovies` (Client Component)
4. `PersonalizedSection` renders rows using `useMovieRecommendations()` (TMDB-based)
5. Users without watchlist see regional popular movies instead

**State Management:**

- **Server State:** Session (Supabase auth cookies in `middleware`), database (Drizzle), ISR cache (TMDB endpoints)
- **Client State:** TanStack Query (react-query) caches all API responses with configurable staleTime
  - `useWatchlistTmdbIds()`: staleTime 30s (deduplicates across all movie cards)
  - `useMovieSearch()`: no staleTime (enables showing stale search while loading)
  - Other movie queries: default staleTime 0 (fresh on mount)
- **UI State:** React hooks (selectedMovie in `HomeMovies`, search query in `DiscoverContent`, chat messages in `MoodSection`)
- **Mutations:** TanStack Query `useMutation` with optimistic updates (watchlist additions/removals update `useWatchlistTmdbIds()` immediately)

## Key Abstractions

**Movie Card (Reusable Component):**
- Purpose: Display single movie with bookmark, hover overlay, genre badges
- Location: `components/movies/movie-card.tsx`
- Pattern: Framer Motion animations, optimistic bookmark, genre display via GENRES constant
- Used in: All movie grids and rows

**Watchlist Mutation Hooks:**
- Purpose: Encapsulate Drizzle mutations + TanStack Query invalidation
- Location: `actions/watchlist.ts` + `hooks/use-watchlist.ts`
- Pattern: Server Actions execute DB logic + revalidatePath; hooks handle optimistic updates
- Example: `useAddToWatchlist()` optimistically updates `useWatchlistTmdbIds()` before server confirms

**Movie API Proxy:**
- Purpose: Single endpoint for TMDB queries (search, trending, discover by genre)
- Location: `app/api/movies/route.ts`
- Pattern: Accept query params → delegate to TMDB library function → return JSON
- Used by: All movie discovery hooks

**TMDB Library:**
- Purpose: Centralize TMDB API calls with ISR caching
- Location: `lib/tmdb.ts`
- Pattern: `tmdbFetch()` helper with Bearer token auth + `next: { revalidate: 300 }`
- Exports: `getTrendingMovies()`, `searchMovies()`, `discoverMoviesByGenre()`, `getMovieDetails()`, etc.
- Used by: API routes, server components

**Rate Limiter:**
- Purpose: Track per-user AI recommendation requests (10/day)
- Location: `lib/rate-limit.ts`
- Pattern: LRUCache with 24-hour TTL, returns `{ allowed, remaining, resetInSeconds }`
- Used by: `/api/ai/recommend` only

**Server Actions for Authorization:**
- Purpose: All data mutations (auth, watchlist) ensure user.id matches before modifying
- Location: `actions/`
- Pattern: Call `getAuthUserId()` → check NOT null → add `AND user_id = ?` to WHERE clause
- Example: `removeFromWatchlist()` deletes only if both ID and userId match (prevents user A from deleting user B's items)

## Entry Points

**Landing Page:**
- Location: `app/page.tsx`
- Triggers: Direct "/" visit
- Responsibilities: Render public marketing content (hero, features, showcase, AI preview, CTA)

**Login & Signup:**
- Location: `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`
- Triggers: User navigates to `/login` or `/signup`
- Responsibilities: Render auth forms (email/password, Google OAuth)

**OAuth Callback:**
- Location: `app/(auth)/callback/route.ts`
- Triggers: Supabase OAuth redirect to `/callback`
- Responsibilities: Exchange code → create session → redirect to `/home`

**Home Page:**
- Location: `app/(app)/home/page.tsx`
- Triggers: Authenticated user navigates to `/home`
- Responsibilities: Fetch trending + personalized data in SSR → render welcome, mood section, movie rows, feature cards

**Discover Page:**
- Location: `app/(app)/discover/page.tsx`
- Triggers: Authenticated user navigates to `/discover`
- Responsibilities: Fetch trending/popular/top_rated (SSR) → render categories, search, filters, grid with infinite scroll

**Watchlist Page:**
- Location: `app/(app)/watchlist/page.tsx`
- Triggers: Authenticated user navigates to `/watchlist`
- Responsibilities: Render `WatchlistContent` (Client Component) which queries and displays user's watchlist with status/rating controls

**AI Recommendations Page:**
- Location: `app/(app)/home/recommendations/page.tsx`
- Triggers: User clicks "View Recommendations" from mood chat with genre suggestions
- Responsibilities: Fetch movies by genres from AI tool call → infinite scroll grid

**Movie Details Modal:**
- Location: `components/movies/movie-detail-modal.tsx`
- Triggers: User clicks on movie card
- Responsibilities: Display full details (cast, watch providers, watchlist controls) in centered dialog

## Error Handling

**Strategy:** Graceful degradation with user-facing error toasts

**Patterns:**
- **Auth errors:** Redirect to login, display form error message
- **API errors:** Return 5xx from API routes → components catch and display toast via `sonner`
- **Drizzle mutations:** Catch DB errors (e.g., duplicate key violation) → return `{ error: "..." }` → hook displays toast
- **Rate limit:** Return 429 with `Retry-After` header → `/api/ai/recommend` returns JSON error → UI shows "Try again tomorrow"
- **Watchlist constraints:** Catch `watchlist_user_tmdb_unique` violation → return "Already in watchlist" → mutation error handler shows toast
- **Server action redirect:** `redirect()` throws internal error (Next.js behavior) — not caught, used intentionally for navigation

**Loading States:**
- SSR pages: `loading.tsx` shows skeletons (e.g., `MovieCardSkeleton`, `WatchlistSkeleton`)
- Client queries: TanStack Query manages loading state → components conditionally show loaders
- Mutations: Button disabled with spinner during optimistic update

## Cross-Cutting Concerns

**Logging:**
- Catch blocks log errors to console with `console.error()`
- API errors include context (endpoint, status) for debugging
- No centralized logger (simple project scope)

**Validation:**
- Auth forms: Zod validation via react-hook-form
- API inputs: Zod `.safeParse()` (e.g., `/api/ai/recommend` validates messages array)
- Server actions: TypeScript type checking (no additional runtime validation)

**Authentication:**
- Supabase auth via JWT in cookies
- Protected routes: `app/(app)/layout.tsx` checks `getUser()` → redirects to login
- Server actions: `getAuthUserId()` helper ensures user context
- API routes: Most are public (TMDB proxy, OAuth callback) except `/api/ai/recommend` which checks auth

**Caching:**
- **ISR:** TMDB endpoints cached 5 minutes (revalidate on demand via revalidatePath)
- **Client:** TanStack Query with configurable staleTime per query
- **Database:** Drizzle queries are real-time (no caching layer)
- **Rate limiting:** LRU cache with 24-hour TTL per user

**Permissions:**
- All Drizzle mutations include `user_id` in WHERE clause (prevent user A accessing user B's data)
- Supabase RLS policies (defined in SQL) enforced at row level
- API routes have no row-level checks (trust that Drizzle + server actions enforce user_id)

