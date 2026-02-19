# Requirements: v0.3 Content Expansion

**Milestone:** v0.3 Content Expansion
**Status:** Roadmapped
**Last updated:** 2026-02-19

---

## Scope

Three features for v0.3:

1. **TV Series discovery page** — `/series` route with curated rows
2. **Skeleton color fix** — replace vibrant crimson skeleton with neutral muted tone
3. **Homepage personalized rows** — daily rotation from top-5 pool with sentence variety

---

## Requirements

### TV-01: TV Series Discovery Page

**Goal:** Users can discover TV shows on a dedicated `/series` page.

**Acceptance criteria:**

- [ ] `/series` page exists and is accessible from the top navbar via a "Series" link
- [ ] Page shows four content rows in order: Trending TV, Korean Drama, Chinese Drama, Top Rated Series
- [ ] Each row uses the existing `MovieRow` component (horizontal scroll with arrows)
- [ ] TV show cards use the existing `MovieCard` component (poster, title, rating badge)
- [ ] Clicking a TV show card opens a detail modal
- [ ] TV detail modal shows: title, overview, first air date, seasons count, episodes count, show status badge (Returning Series / Ended / Cancelled), "Created by:" instead of "Director:", and watch providers for the user's region
- [ ] Korean Drama row uses TMDB discover with `with_origin_country=KR&with_genres=18&with_original_language=ko`
- [ ] Chinese Drama row uses TMDB discover with `with_origin_country=CN&with_genres=18`
- [ ] Page has a route-level `loading.tsx` skeleton matching the discover page skeleton pattern
- [ ] TV shows do NOT have watchlist add/remove buttons in v0.3 (read-only discovery)
- [ ] `TV_GENRES` constant added to `lib/constants.ts` for TV-specific genre IDs

**Out of scope for TV-01:**
- TV search / search bar on /series
- TV genre filter row on /series
- TV show watchlisting (deferred — no schema changes in v0.3)
- Anime or Taiwanese Drama rows (deferred to v0.4)

---

### SKEL-01: Skeleton Color Fix

**Goal:** Loading skeletons use a neutral muted tone instead of the crimson accent color.

**Acceptance criteria:**

- [ ] `components/ui/skeleton.tsx` uses `bg-muted` instead of `bg-accent`
- [ ] All other skeleton components updated if they use `bg-accent` directly
- [ ] Skeleton pulse animation is preserved (only color changes)
- [ ] In dark mode, skeletons render as a dark neutral gray, not crimson
- [ ] No other visual changes to skeleton shape or behavior

---

### HOME-01: Homepage Personalized Rows

**Goal:** The "Because you liked" section on `/home` rotates daily from the user's top-5 liked/watched movies and uses varied sentence phrasing.

**Acceptance criteria:**

- [ ] "Because you liked [Title]" rows are shown on the home page for users with at least 1 liked or watched movie
- [ ] Daily rotation: the movie selected as the source changes once per day, derived deterministically from userId + current date (no `Math.random()`)
- [ ] Selection pool: user's top-5 most recently liked (`rating = 1`) or watched movies
- [ ] Row label uses one of 4+ sentence patterns (e.g. "Because you liked", "More like", "If you loved", "Since you enjoyed") — rotated based on the same daily seed
- [ ] Users with no liked/watched movies see either no "Because you liked" rows or a generic fallback (design decision: show no rows, no error state needed)
- [ ] Movie recommendations come from TMDB `/movie/{id}/recommendations` (existing API pattern)
- [ ] Row shows up to 20 recommendation results in horizontal scroll

---

## Constraints

All constraints from PROJECT.md apply:

- Tech stack locked: Next.js 16, React 19, Tailwind v4, shadcn/ui, Drizzle ORM, Supabase
- No new runtime npm packages unless absolutely unavoidable
- No database schema changes in v0.3 (watchlist media_type migration deferred to v0.4)
- WCAG 2.1 AA minimum on all new components
- 44px touch targets on mobile
- Framer Motion for any animations
- No `Math.random()` in Server Components (use deterministic seeding)

---

## Out of Scope (v0.3)

- TV show watchlisting (requires schema migration — deferred to v0.4)
- TV search on /discover or /series
- TV genre filters
- Anime / Taiwanese / Japanese drama rows
- AI mood recommendations for TV shows
- Episode-level progress tracking
- Season-by-season watchlist status
- Any schema changes

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TV-01 | Phase 4 (data layer) + Phase 5 (UI) | Pending |
| SKEL-01 | Phase 6 | Pending |
| HOME-01 | Phase 6 | Pending |
