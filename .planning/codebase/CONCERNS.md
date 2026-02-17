# Codebase Concerns

**Analysis Date:** 2026-02-17

## Tech Debt

**Large Modal Component:**
- Issue: `components/movies/movie-detail-modal.tsx` is 510 lines (monolithic single component)
- Files: `components/movies/movie-detail-modal.tsx`
- Impact: Hard to test, difficult to modify without side effects, violates single responsibility
- Fix approach: Extract `ProviderGrid`, `DetailSkeleton`, `WatchlistActions`, `CastSection` into separate components in `components/movies/modals/` subdirectory

**In-Memory Rate Limiting at Scale:**
- Issue: LRU cache limited to 500 users with 24-hour TTL lives in server memory
- Files: `lib/rate-limit.ts`
- Impact: Not persistent across server restarts, no cross-instance coordination (serverless deployments lose state), can't handle multi-region deployments
- Current mitigation: Simple string-based user ID key, works for single-region single-instance (development/MVP)
- Fix approach: Migrate to Redis-backed rate limiting (Upstash or Supabase Cloud) before multi-region or serverless deployment

**Fire-and-Forget Database Insert:**
- Issue: AI recommendation storage is async fire-and-forget with silent error swallowing
- Files: `app/api/ai/recommend/route.ts` (lines 137-145)
- Impact: Failed recommendation saves go unlogged, user never knows recommendations weren't persisted
- Fix approach: Wrap in try-catch with logging, or use guaranteed delivery queue (job queue), or await before response

**Duplicate Movie Filtering Not Applied Client-Side:**
- Issue: TMDB dynamic ranking returns same movie across pagination pages; deduplication only happens during normalization
- Files: `hooks/use-movies.ts`, `components/movies/movie-grid.tsx`
- Impact: Users see same movie in discover infinite scroll after scrolling multiple pages
- Fix approach: Use `useMemo` with `Set<movieId>` in `movie-grid.tsx` to deduplicate before rendering

**No Query Cache Keys for Pagination:**
- Issue: `movieKeys.category()` and `movieKeys.search()` don't include page param in key (handled manually)
- Files: `hooks/use-movies.ts` (lines 12-14, 86-87)
- Impact: Page 2 and page 1 may incorrectly share cache, or cache invalidation is overkill
- Fix approach: Include page in all movieKeys to ensure each page is cached separately

**Error Boundary Details Not Logged:**
- Issue: Error pages catch and display generic messages, but actual error is only logged to console
- Files: `app/(app)/home/error.tsx`, `app/(app)/discover/error.tsx`, `app/(app)/watchlist/error.tsx`
- Impact: Server errors hard to debug in production; no error tracking/alerting
- Fix approach: Integrate Sentry or similar for error reporting; pass error digest to monitoring

**Drizzle Direct Connection Bypasses RLS at Runtime:**
- Issue: `drizzle/index.ts` uses `DATABASE_URL` transaction pooler directly; Drizzle does NOT respect Supabase RLS
- Files: `drizzle/index.ts`, all server actions in `actions/watchlist.ts`, `actions/auth.ts`
- Impact: Critical security risk if any query forgets `eq(userId, user.id)` WHERE clause—user can read/modify others' data
- Current mitigation: Manual explicit WHERE clauses with `eq(watchlist.userId, userId)` in every watchlist query
- Fix approach: Code review all Drizzle queries to ensure user.id checks; consider Supabase client instead for safer RLS-enforced queries; add tests to verify RLS bypass risk is mitigated

**Watchlist Status Enum Serialization Quirk:**
- Issue: `serializeItem()` in `actions/watchlist.ts` (line 25) maps `"watching"` to `"want_to_watch"` silently
- Files: `actions/watchlist.ts` (line 25)
- Impact: If a movie is marked as "watching" in DB, it appears as "want_to_watch" to client; inconsistent state
- Fix approach: Remove the conditional; use schema enum as-is. Or add `"watching"` to `WatchlistStatus` type if intentional

**Missing Timeout on TMDB API Calls:**
- Issue: `lib/tmdb.ts` fetch calls have no timeout; can hang indefinitely if TMDB is slow
- Files: `lib/tmdb.ts` (lines 16-22)
- Impact: API routes block indefinitely on TMDB failures, timeout at Next.js level (harder to debug)
- Fix approach: Add `signal: AbortSignal.timeout(10000)` to fetch options

**No Input Validation on API Routes:**
- Issue: `/api/movies/route.ts` (lines 12-15) parses query params without validation
- Files: `app/api/movies/route.ts`
- Impact: Could accept malformed or extremely large page numbers (e.g., `page=999999`), empty query string
- Fix approach: Use Zod to validate `{ query?: string, category?, genre?, page: number }` before use

**AI Recommendation Tool Execution Not Awaited:**
- Issue: `execute` function in `suggest_genres` tool (lines 133-148) returns immediately; DB insert happens async
- Files: `app/api/ai/recommend/route.ts` (lines 133-148)
- Impact: Recommendation record may not exist when response sent to client, leading to race conditions in UI
- Fix approach: Await DB insert before returning, or use background job for persistence

---

## Known Bugs

**Watchlist Status Dropdown Silent Failure:**
- Symptoms: Changing status in modal shows success toast but status doesn't update
- Files: `components/movies/movie-detail-modal.tsx` (lines 271-286)
- Trigger: Network error during status mutation; optimistic update reverts on error but no error toast shown
- Workaround: Refresh page manually

**Infinite Scroll Sentinel Not Removed from DOM:**
- Symptoms: Last page of discover results shows blank space from unused sentinel element
- Files: `components/movies/movie-grid.tsx`
- Trigger: `hasNextPage` becomes false but sentinel div remains in DOM
- Workaround: None (cosmetic only)

**ScrollArea Wrapping Issue (Known Platform Bug):**
- Symptoms: Cast row in movie detail modal clips off right side; horizontal scroll doesn't show last cast member
- Files: `components/movies/movie-detail-modal.tsx` (lines 417)
- Cause: Radix ScrollArea wraps children in `<div style="minWidth: 100%, display: table">` which breaks flex shrinking
- Current mitigation: None (acknowledged in CLAUDE.md but not yet fixed)
- Fix approach: Replace `<ScrollArea>` with plain `<div className="overflow-y-auto">` to eliminate table wrapper

---

## Security Considerations

**Drizzle Queries Bypass RLS:**
- Risk: Direct connection to Supabase via Drizzle uses transaction pooler, which cannot enforce RLS
- Files: `drizzle/index.ts`, `actions/watchlist.ts`, all server actions
- Current mitigation: Manual `WHERE user_id = current_user_id` checks in every query
- Recommendations:
  1. Conduct security audit of all Drizzle queries to ensure no missing user ID checks
  2. Add integration tests that verify a user cannot access another user's watchlist
  3. Consider using Supabase client (`@supabase/supabase-js` with RLS-enforced queries) for data operations instead of Drizzle
  4. Document this limitation in code comments on `drizzle/index.ts`

**AI Rate Limit Easily Bypassed:**
- Risk: In-memory rate limit can be circumvented by multiple server instances or client spoofing user IDs (if auth is compromised)
- Files: `lib/rate-limit.ts`, `app/api/ai/recommend/route.ts`
- Current mitigation: Relies on Supabase auth `user.id` being correct
- Recommendations:
  1. Move to Redis-backed rate limiting before production
  2. Add IP-based fallback rate limiting if user auth fails
  3. Log rate limit hits for abuse monitoring

**API Routes Not Authenticated:**
- Risk: `/api/movies/*` routes have no auth check; can be hit from anywhere
- Files: `app/api/movies/route.ts`, `app/api/movies/[id]/route.ts`, `app/api/movies/[id]/recommendations/route.ts`
- Current mitigation: TMDB API requires API key (secret), so unauthorized access only hits rate limits
- Recommendations:
  1. Add rate limiting to `/api/movies/*` to prevent TMDB quota exhaustion
  2. Consider adding auth checks if TMDB key becomes sensitive (e.g., API key exposure)

---

## Performance Bottlenecks

**AI Endpoint Generates Context on Every Request:**
- Problem: `getWatchlistContext()` in `app/api/ai/recommend/route.ts` queries top 5 watchlist items, fetches their titles
- Files: `app/api/ai/recommend/route.ts` (lines 15-30)
- Cause: No caching; repeated AI requests will re-query same watchlist
- Improvement path:
  1. Cache watchlist context in TanStack Query at 5-minute staleTime
  2. Pass pre-fetched context from client (securely) instead of fetching server-side

**Movie Details Loaded Twice in Modal:**
- Problem: Modal calls `useMovieDetails()` which fetches from `/api/movies/[id]`, but movie data already exists from discover grid
- Files: `components/movies/movie-detail-modal.tsx` (line 132)
- Cause: Modal doesn't receive full `MovieDetailsResponse` from grid; only has `Movie` (partial)
- Improvement path:
  1. Pass full movie details through modal props from parent component
  2. Use `useQuery` with initial data from modal props to avoid refetch
  3. Or structure so detailed data is fetched once when modal opens

**Discover Page Fetches All 3 Categories SSR:**
- Problem: Home page and discover load trending, popular, top_rated via `Promise.all()` even if only one is viewed
- Files: `app/(app)/home/page.tsx`, `app/(app)/discover/page.tsx`
- Cause: Early-phase design fetches all upfront
- Improvement path:
  1. Use `useSuspense=false` on TanStack Query to lazy-load non-visible categories
  2. Implement route-level cache headers to reduce repeated TMDB calls

---

## Fragile Areas

**Movie Grid Deduplication:**
- Files: `components/movies/movie-grid.tsx`
- Why fragile: Relies on TMDB API behavior (dynamic ranking changes); no explicit deduplication logic
- Safe modification:
  1. Add explicit `Set<id>` deduplication in `MovieGrid` component
  2. Wrap movies in `useMemo` before rendering
- Test coverage: No tests for infinite scroll deduplication

**Watchlist Constraint Violation Handling:**
- Files: `actions/watchlist.ts` (lines 106-114)
- Why fragile: Catches error by string matching `"watchlist_user_tmdb_unique"` which depends on constraint name
- Safe modification:
  1. Create custom error class from Drizzle instead of string matching
  2. Or wrap in typed try-catch for unique constraint errors
- Test coverage: No tests for duplicate add attempt

**AI Tool Extraction:**
- Files: `hooks/use-ai.ts` (lines 20-36)
- Why fragile: Manually iterates messages and checks `part.type.startsWith("tool-")` and `part.state === "output-available"`
- Safe modification:
  1. Use AI SDK utility functions if available
  2. Add type guards or discriminated union for tool parts
- Test coverage: No tests for genre suggestion extraction logic

**Theme/Styling Dependency on Custom Tailwind Config:**
- Files: `components.json`, `tailwind.config.ts` (assumed but not shown)
- Why fragile: Crimson accent color `oklch(0.637 0.237 25.331)` hard-coded; switching to different palette requires multiple file edits
- Safe modification:
  1. Centralize color tokens in CSS variables or Tailwind config
  2. Document color scale usage
- Test coverage: No visual regression tests

---

## Scaling Limits

**In-Memory Rate Limit Cache:**
- Current capacity: 500 concurrent users
- Limit: Once cache fills, oldest entries evicted; new users won't be rate limited
- Scaling path:
  1. Replace with Upstash Redis (serverless, managed)
  2. Set global rate limits per IP + user for defense-in-depth

**TMDB API Quota:**
- Current capacity: TMDB free tier (40 requests/10 seconds)
- Limit: Discover page loads 3 categories = 3 TMDB calls; scaling to 100 concurrent users = bottleneck
- Scaling path:
  1. Implement client-side caching with 5-minute ISR on TMDB API routes
  2. Upgrade to TMDB paid tier or use CDN caching
  3. Add queue-based prefetching for trending movies

**Supabase Database Connection Pool:**
- Current capacity: Transaction pooler limited to default 20 connections (varies by plan)
- Limit: Each server action opens connection; 100+ concurrent watchlist mutations = pool exhaustion
- Scaling path:
  1. Verify Drizzle `prepare: false` is working (uses pooler correctly)
  2. Upgrade Supabase plan for larger pool
  3. Consider read replica for heavy queries (e.g., `getWatchlist`)

---

## Dependencies at Risk

**AI SDK Breaking Changes:**
- Risk: `ai` SDK v6 used; recent major version bump from v5 → v6 with breaking API changes
- Impact: Tool call API changed (`inputSchema` not `parameters`, `stopWhen: stepCountIs()` new), `useChat` transport signature changed
- Migration plan:
  1. Pin to stable `ai@^6.x` in package.json
  2. Set up automated dependency update warnings (Dependabot)
  3. Test AI endpoints thoroughly before upgrading next major version

**Drizzle ORM Version Lag:**
- Risk: `drizzle-orm@0.45.1` is released; new versions frequently improve type safety and add features
- Impact: May miss bug fixes or RLS-related security patches
- Migration plan:
  1. Monthly minor version bumps (patch-safe)
  2. Quarterly major version review with test suite

---

## Missing Critical Features

**Error Recovery for Failed Rate-Limited Requests:**
- Problem: 429 response with `Retry-After` header sent, but UI doesn't parse it
- Blocks: Users hitting rate limit get unhelpful error message and no retry guidance
- Solution:
  1. Parse `Retry-After` header in `useMoodChat` error handler
  2. Display "Try again in X seconds" message

**No Error Logging/Monitoring:**
- Problem: Console errors logged locally only; no production error tracking
- Blocks: Can't detect issues in production; reactive debugging only
- Solution: Integrate Sentry, LogRocket, or similar for error tracking and performance monitoring

**No Analytics:**
- Problem: Can't measure feature usage (e.g., which genres users search for most)
- Blocks: Data-driven product decisions impossible
- Solution: Add PostHog or Plausible for privacy-respecting analytics

**No Admin Dashboard:**
- Problem: Can't view or manage user data; support requests can't be resolved
- Blocks: Can't help users who lost watchlist or need data corrections
- Solution: Add `/admin` routes (auth-gated) with user search, watchlist inspection, delete capabilities

---

## Test Coverage Gaps

**No Tests for Watchlist Authorization:**
- What's not tested: User A cannot access User B's watchlist via server actions
- Files: `actions/watchlist.ts`
- Risk: RLS bypass vulnerability could exist and not be caught
- Priority: **High** (security-critical)

**No Tests for Rate Limiting:**
- What's not tested: Rate limit enforcement, counter increment, TTL expiry
- Files: `lib/rate-limit.ts`, `app/api/ai/recommend/route.ts`
- Risk: Rate limit could be broken after refactoring and not noticed
- Priority: **High** (abuse prevention)

**No Tests for Duplicate Movies in Infinite Scroll:**
- What's not tested: Same movie doesn't appear twice when scrolling discover with dynamic TMDB ranking
- Files: `components/movies/movie-grid.tsx`, `hooks/use-movies.ts`
- Risk: Bad user experience; user confusion
- Priority: **Medium**

**No Tests for AI Tool Parsing:**
- What's not tested: Genre suggestion extraction from AI response works correctly
- Files: `hooks/use-ai.ts`, `app/api/ai/recommend/route.ts`
- Risk: Genre suggestion could be malformed or null when it shouldn't be
- Priority: **Medium** (feature-critical)

**No E2E Tests:**
- What's not tested: Full user journeys (login → discover → bookmark → rate → AI recommendation)
- Files: Entire app
- Risk: Regression bugs in integration scenarios
- Priority: **Medium** (post-MVP)

---

*Concerns audit: 2026-02-17*
