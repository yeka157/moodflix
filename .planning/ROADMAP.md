# Roadmap: Moodflix

## Milestones

- ✅ **v0.2 Alpha Polish** — Phases 1–3 (shipped 2026-02-19)
- ✅ **v0.3 Content Expansion** — Phases 4–8 (shipped 2026-02-28)
- 🚧 **v0.4 Watchlist & Polish** — Phases 9–13 (in progress)

## Phases

<details>
<summary>✅ v0.2 Alpha Polish (Phases 1–3) — SHIPPED 2026-02-19</summary>

- [x] Phase 1: Watchlist Reactivity (3/3 plans) — completed 2026-02-18
- [x] Phase 2: Branding & Assets (3/3 plans) — completed 2026-02-19
- [x] Phase 3: Polish & QA (4/4 plans) — completed 2026-02-19

See: `.planning/milestones/v0.2-ROADMAP.md` for full details.

</details>

<details>
<summary>✅ v0.3 Content Expansion (Phases 4–8) — SHIPPED 2026-02-28</summary>

- [x] Phase 4: TV Series Data Layer (2/2 plans) — completed 2026-02-22
- [x] Phase 5: TV Series Page + Modal (2/2 plans) — completed 2026-02-22
- [x] Phase 6: Homepage Polish (2/2 plans) — completed 2026-02-23
- [x] Phase 7: UI/UX Revamp (4/4 plans) — completed 2026-02-23
- [x] Phase 07.1: Bug Fixes & Improvements (3/3 plans) — completed 2026-02-25
- [x] Phase 8: Landing Page Revamp (4/4 plans) — completed 2026-02-27

See: `.planning/milestones/v0.3-ROADMAP.md` for full details.

</details>

### v0.4 Watchlist & Polish (In Progress)

**Milestone Goal:** Enable TV show watchlisting, fix watchlist UX bugs, improve discovery navigation, add AI guardrails and origin country filtering with conversation logging, and introduce My Top 100 personal lists.

- [x] **Phase 9: Schema Migration** — Add media_type to watchlist, update unique constraint, add messages column to ai_recommendations, create top_hundred table (completed 2026-03-02)
- [x] **Phase 10: TV Watchlisting & Watchlist UX** — Full TV watchlist CRUD from the TV detail page, library card routing, type badges, instant sync, and media type filter (completed 2026-03-03)
- [x] **Phase 10.1: Fix UI for Mobile View** — Fix hero text crop, duplicate poster rows, rigid animations, and missing padding on mobile (completed 2026-03-03)
- [ ] **Phase 11: Discovery UX** — TV series search bar, rename Discover to Movies in sidebar, standardize rating display to X/10 format
- [ ] **Phase 12: AI Polish** — Origin country filtering for country-specific recommendations, off-topic guardrails, and fire-and-forget conversation logging
- [ ] **Phase 13: My Top 100** — Personal ranked list of up to 100 movies and TV shows with CRUD and move up/down reordering

## Phase Details

### Phase 9: Schema Migration
**Goal**: The database is ready to support TV watchlisting, conversation logging, and My Top 100 — all subsequent phases depend on this foundation being in place.
**Depends on**: Nothing (first phase of v0.4)
**Requirements**: TVWL-07, TVWL-08, AIPOL-05, AIPOL-06
**Success Criteria** (what must be TRUE):
  1. Drizzle Studio shows a `media_type` column on the watchlist table with all existing rows backfilled to `'movie'`
  2. The unique constraint on watchlist is `(userId, tmdbId, mediaType)` — a movie and TV show with the same TMDB ID can both be added without a conflict error
  3. Drizzle Studio shows a `messages` column (JSONB, nullable) on the `ai_recommendations` table — existing rows are unaffected
  4. Drizzle Studio shows the new `top_hundred` table with `rank`, `media_type`, and both unique constraints on `(userId, rank)` and `(userId, tmdbId, mediaType)`
  5. `npm run build` and `npm run lint` pass clean after all type updates propagate through `types/watchlist.ts`, `types/ai.ts`, and new `types/top-hundred.ts`
**Plans**: TBD

### Phase 09.1: PWA Setup (INSERTED)

**Goal:** Moodflix is installable as a Progressive Web App with a precached app shell, runtime caching for TMDB images and API responses, offline fallback page, connectivity toast notifications, Chrome/Android install prompt, and cinematic brand-aligned icons.
**Depends on:** Phase 9
**Plans:** 3/3 plans complete

Plans:
- [ ] 09.1-01-PLAN.md — Core PWA infrastructure (Serwist service worker, manifest, offline page, SerwistProvider)
- [ ] 09.1-02-PLAN.md — Offline UX (connectivity toast, install prompt banner, hooks)
- [ ] 09.1-03-PLAN.md — Cinematic icon generation + end-to-end PWA verification

### Phase 09.1.1: Homepage TV Series Integration (INSERTED)

**Goal:** The homepage surfaces TV series content alongside movies — a "Trending TV Shows" row appears below the movie trending row, and a "Browse Series" feature card links to the /series page.
**Depends on:** Phase 09.1
**Plans:** 3/3 plans complete

Plans:
- [ ] 09.1.1-01-PLAN.md — Add TV trending row and Browse Series feature card to homepage

### Phase 10: TV Watchlisting & Watchlist UX
**Goal**: Users can add TV shows to their library from the TV detail page, and all watchlist state syncs instantly across every card on every page without a refresh.
**Depends on**: Phase 9
**Requirements**: TVWL-01, TVWL-02, TVWL-03, TVWL-04, TVWL-05, TVWL-06, WLUX-01, WLUX-02, WLUX-03
**Success Criteria** (what must be TRUE):
  1. User can add a TV show to their library (bookmark), mark it watched (CircleCheck), like/dislike it, and remove it — all from the `/tv/[id]` detail page — with icons reflecting state instantly
  2. Library cards for TV shows link to `/tv/[id]`, not `/movie/[id]`, and display a visible "TV" or "Movie" type badge
  3. After adding or changing the status of any item from any page, the bookmark/watched icons on all other cards (home, discover, series pages) update without a page refresh
  4. Changing a movie's status on the library page does not remove the card from the current view — the card stays and its flags update in place
  5. Library page shows "All / Movies / TV Shows" filter controls alongside the existing status tabs — selecting "TV Shows" shows only TV entries
**Plans:** 3/3 plans complete

Plans:
- [ ] 10-01-PLAN.md — Media-type-aware hooks, actions, and card components (foundation)
- [ ] 10-02-PLAN.md — TV detail page watchlist action bar + movie page mediaType fixes
- [ ] 10-03-PLAN.md — Library card routing, type badges, media type filter, client-side filtering

### Phase 10.1: Fix UI for Mobile View (INSERTED)

**Goal:** The landing page hero text and poster showcase render correctly on mobile, all Framer Motion animations feel smooth and natural, and all content pages have consistent horizontal padding — no cropping, no duplicates, no rigid motion, no edge-to-edge content.
**Depends on:** Phase 10
**Plans:** 2/2 plans complete

Plans:
- [x] 10.1-01-PLAN.md — Landing page hero text responsive fix + marquee duplicate poster fix
- [x] 10.1-02-PLAN.md — App-wide Framer Motion spring tuning + detail page padding consistency

### Phase 11: Discovery UX
**Goal**: Users can search for TV shows from the series page, the sidebar label correctly reads "Movies" instead of "Discover", and ratings display as a clear X/10 format throughout the app.
**Depends on**: Phase 9
**Requirements**: DISC-01, DISC-02, DISC-03
**Success Criteria** (what must be TRUE):
  1. The `/series` page has a search bar — typing a query returns matching TV shows, replacing the browse rows while the query is active
  2. The sidebar navigation item that links to `/discover` reads "Movies" (not "Discover") — the route `/discover` itself is unchanged
  3. TMDB ratings on movie and TV detail pages display as "X.X/10" — the rating is hidden when `vote_count` is 10 or fewer
**Plans**: TBD

### Phase 12: AI Polish
**Goal**: AI recommendations filter by origin country when the user asks for country-specific content, off-topic queries are redirected gracefully, and full conversations are logged to the database for analytics without adding any latency to the streaming response.
**Depends on**: Phase 9
**Requirements**: AIPOL-01, AIPOL-02, AIPOL-03, AIPOL-04, AIPOL-05, AIPOL-06
**Success Criteria** (what must be TRUE):
  1. Typing "recommend me K-dramas" into the mood chat produces a recommendations page where the TMDB discover call includes `with_origin_country=KR` — confirmed in the browser network tab
  2. Typing "help me write a cover letter" into the mood chat receives a gentle redirect to movie/TV topics — it does not produce genres or an error
  3. Typing "I want something warm like Studio Ghibli" (cultural reference, not off-topic) produces Animation genre suggestions — it is not refused or hedged
  4. After a genre suggestion is made, a row appears in the `ai_recommendations` table with the full conversation array in the `messages` column — inspectable in Drizzle Studio
  5. Streaming TTFB (time to first byte) is not measurably slower after adding conversation logging — the DB insert is fire-and-forget
**Plans**: TBD

### Phase 13: My Top 100
**Goal**: Users can build and maintain a personal ranked list of up to 100 favorite movies and TV shows, accessible from within the library.
**Depends on**: Phase 9
**Requirements**: TOP-01, TOP-02, TOP-03, TOP-04, TOP-05, TOP-06, TOP-07
**Success Criteria** (what must be TRUE):
  1. User can add a movie or TV show to their Top 100 from the detail page or from the library — the item appears in the ranked list immediately
  2. User can remove an item from their Top 100 — it disappears from the list immediately
  3. User can move an item up or down in rank using arrow controls — adjacent items swap rank instantly
  4. Attempting to add a 101st item shows an error — the list enforces a maximum of 100 items
  5. Attempting to add the same movie or TV show twice shows "Already in your Top 100" — no duplicate entries exist
  6. My Top 100 is accessible at `/library/top-100` or as a tab within the library page
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Watchlist Reactivity | v0.2 | 3/3 | Complete | 2026-02-18 |
| 2. Branding & Assets | v0.2 | 3/3 | Complete | 2026-02-19 |
| 3. Polish & QA | v0.2 | 4/4 | Complete | 2026-02-19 |
| 4. TV Series Data Layer | v0.3 | 2/2 | Complete | 2026-02-22 |
| 5. TV Series Page + Modal | v0.3 | 2/2 | Complete | 2026-02-22 |
| 6. Homepage Polish | v0.3 | 2/2 | Complete | 2026-02-23 |
| 7. UI/UX Revamp | v0.3 | 4/4 | Complete | 2026-02-23 |
| 07.1. Bug Fixes & Improvements | v0.3 | 3/3 | Complete | 2026-02-25 |
| 8. Landing Page Revamp | v0.3 | 4/4 | Complete | 2026-02-27 |
| 9. Schema Migration | v0.4 | Complete    | 2026-03-02 | 2026-03-01 |
| 10. TV Watchlisting & Watchlist UX | 3/3 | Complete    | 2026-03-03 | - |
| 10.1. Fix UI for Mobile View | 2/2 | Complete   | 2026-03-03 | - |
| 11. Discovery UX | v0.4 | 0/TBD | Not started | - |
| 12. AI Polish | v0.4 | 0/TBD | Not started | - |
| 13. My Top 100 | v0.4 | 0/TBD | Not started | - |
