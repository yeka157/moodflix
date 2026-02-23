# Roadmap: Moodflix

## Milestones

- ✅ **v0.2 Alpha Polish** — Phases 1–3 (shipped 2026-02-19)
- 🚧 **v0.3 Content Expansion** — Phases 4–7 (in progress)

## Phases

<details>
<summary>✅ v0.2 Alpha Polish (Phases 1–3) — SHIPPED 2026-02-19</summary>

- [x] Phase 1: Watchlist Reactivity (3/3 plans) — completed 2026-02-18
- [x] Phase 2: Branding & Assets (3/3 plans) — completed 2026-02-19
- [x] Phase 3: Polish & QA (4/4 plans) — completed 2026-02-19

See: `.planning/milestones/v0.2-ROADMAP.md` for full details.

</details>

### 🚧 v0.3 Content Expansion (In Progress)

**Milestone Goal:** Expand the app with TV series discovery, fix skeleton loading colors, surface personalized "Because you liked" rows on the home page, and revamp the UI/UX with a sidebar navigation and Stremio-inspired design.

- [x] **Phase 4: TV Series Data Layer** - Types, constants, API routes, and TanStack Query hooks for TV shows (completed 2026-02-22)
- [x] **Phase 5: TV Series Page + Modal** - `/series` page with four content rows and extended detail modal (completed 2026-02-22)
- [x] **Phase 6: Homepage Polish** - Skeleton color fix and personalized recommendation rows (completed 2026-02-23)
- [ ] **Phase 7: UI/UX Revamp** - Sidebar navigation, color scheme overhaul, and Stremio-inspired layout patterns

## Phase Details

### Phase 4: TV Series Data Layer
**Goal**: All TV data infrastructure is in place — types, constants, proxy routes, and hooks — so Phase 5 can build UI without touching data plumbing.
**Depends on**: Nothing (independent of existing movie data layer; no schema changes)
**Requirements**: TV-01 (partial — data layer only)
**Success Criteria** (what must be TRUE):
  1. `types/tv.ts` exports `TVShow`, `TVDetails`, `TVDetailsResponse`, and `normalizeTVShow()` such that `normalizeTVShow(rawTV)` returns an object that satisfies the `Movie` type contract (title, release_date, etc. populated from TV fields)
  2. `GET /api/tv?category=trending` returns a valid TMDB TV response; `GET /api/tv?category=korean_drama` returns drama results filtered by country and language
  3. `GET /api/tv/[id]` returns TV show details including `credits` and `watch/providers` in one response
  4. `useTrendingTV()`, `useTopRatedTV()`, `useKoreanDramas()`, `useChineseDramas()` hooks each return normalized `Movie[]` data with no `undefined` title or release_date values
  5. `lib/constants.ts` exports `TV_GENRES` record covering TV-specific genre IDs (10759, 10762–10768) with correct labels

**Plans**: 2 plans

Plans:
- [ ] 04-01: Types, constants, and TMDB fetch functions (`types/tv.ts`, `TV_GENRES` in `lib/constants.ts`, TV functions in `lib/tmdb.ts`)
- [ ] 04-02: TV API proxy routes and TanStack Query hooks (`app/api/tv/route.ts`, `app/api/tv/[id]/route.ts`, `hooks/use-tv.ts`)

---

### Phase 5: TV Series Page + Modal
**Goal**: Users can navigate to `/series`, browse four curated TV content rows, and open a TV-specific detail modal — all using the existing movie UI components with minimal modification.
**Depends on**: Phase 4
**Requirements**: TV-01
**Success Criteria** (what must be TRUE):
  1. A "Series" link appears in the top navbar and navigates to `/series` without a full page reload
  2. The `/series` page displays four labeled rows in order: Trending TV, Korean Drama, Chinese Drama, Top Rated Series — each with horizontal scroll and arrow navigation
  3. Clicking any TV show card opens a detail modal that shows title, overview, first air date, number of seasons, number of episodes, show status badge (Returning Series / Ended / Cancelled / Miniseries), and "Created by:" instead of "Director:"
  4. Watch providers for the user's region appear in the TV detail modal (same regional detection as movie modal)
  5. TV show cards do not show watchlist add/remove buttons — the modal has no "Add to Watchlist" control
  6. The `/series` route shows a loading skeleton while data loads, matching the discover page skeleton pattern

**Plans**: 2 plans

Plans:
- [ ] 05-01: Series page scaffolding — `app/(app)/series/page.tsx`, `app/(app)/series/loading.tsx`, `components/series/series-content.tsx`, navbar "Series" link
- [ ] 05-02: TV detail modal extension — `mediaType` prop on `movie-detail-modal.tsx` with TV-specific branching for creator label, season/episode counts, and status badge

---

### Phase 6: Homepage Polish
**Goal**: Loading skeletons render in a neutral gray tone, and signed-in users with watch history see personalized "Because you liked" rows on the home page.
**Depends on**: Phase 5
**Requirements**: SKEL-01, HOME-01
**Success Criteria** (what must be TRUE):
  1. All loading skeleton components render dark neutral gray (not crimson) in dark mode — the `bg-accent` token is fully replaced by `bg-muted` across every skeleton file
  2. A signed-in user with at least one liked or watched movie sees a "Because you liked [Title]" row on the home page showing up to 20 TMDB recommendation results in horizontal scroll
  3. The row label uses one of 4+ sentence patterns (e.g. "Because you liked", "More like", "If you loved", "Since you enjoyed") — the pattern rotates daily and deterministically (no `Math.random()`)
  4. The source movie rotates daily from the user's top-5 most recently liked or watched movies using a deterministic seed derived from userId + current date
  5. Users with no liked or watched movies see no "Because you liked" rows and no error state

**Plans**: 2 plans

Plans:
- [x] 06-01: Skeleton color fix — replace `bg-accent` with `bg-muted` and slow pulse to 3s
- [x] 06-02: Homepage personalized rows — daily rotation, varied sentence patterns, section reorder

### Phase 7: UI/UX Revamp
**Goal**: Replace top navbar with sidebar navigation, update color scheme, and adopt Stremio-inspired layout patterns across all pages — using Pencil MCP for design prototyping. Reference: `Revamp-UI.png` (sidebar + color scheme), `Revamp-UI-1.png` and `Revamp-UI-2.png` from stremio.com (UI/UX style — pill metadata, compact icon sidebar, detail panels).
**Depends on**: Phase 6
**Requirements**: REVAMP-01
**Success Criteria** (what must be TRUE):
  1. Top navbar is replaced with a collapsible sidebar (icon-only compact mode + expanded mode with labels) containing Home, Discover, Series, Library navigation
  2. Color scheme is updated away from crimson accent — new palette inspired by Revamp-UI.png reference
  3. Movie/TV detail modal adopts Stremio-inspired layout: pill-style genre tags, pill-style cast chips, structured metadata (runtime, year, rating), bottom action bar
  4. Discover and Series pages adopt grid layout with filter dropdowns (matching Revamp-UI-2.png style)
  5. All existing features (home, discover, series, library, detail modal, AI mood section) remain fully functional after the redesign
  6. Responsive: sidebar collapses to icon-only on mobile/tablet, expands on desktop

**Plans**: 4 plans

Plans:
- [ ] 07-01-PLAN.md — Sidebar + bottom tab bar + warmer color tokens + layout restructure
- [ ] 07-02-PLAN.md — Movie + TV detail page routes (Stremio-inspired full-page layout)
- [ ] 07-03-PLAN.md — Discover + Series grid layout with filter dropdowns
- [ ] 07-04-PLAN.md — Card navigation migration + search drawer + navbar removal + visual verification

### Phase 8: Landing page revamp

**Goal:** [To be planned]
**Depends on:** Phase 7
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 8 to break down)

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Watchlist Reactivity | v0.2 | 3/3 | Complete | 2026-02-18 |
| 2. Branding & Assets | v0.2 | 3/3 | Complete | 2026-02-19 |
| 3. Polish & QA | v0.2 | 4/4 | Complete | 2026-02-19 |
| 4. TV Series Data Layer | 2/2 | Complete   | 2026-02-22 | - |
| 5. TV Series Page + Modal | 2/2 | Complete   | 2026-02-22 | - |
| 6. Homepage Polish | v0.3 | 2/2 | Complete | 2026-02-23 |
| 7. UI/UX Revamp | v0.3 | 0/4 | Planned | - |
