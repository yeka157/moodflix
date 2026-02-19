# Feature Research

**Domain:** TV Series discovery page — extending an existing movie watchlist SaaS
**Researched:** 2026-02-19
**Confidence:** MEDIUM (TMDB API facts HIGH from training knowledge; platform UX patterns MEDIUM from observed behavior; no live WebSearch/WebFetch available)

---

## Context

This research addresses a **subsequent milestone** (v0.3) on top of a completed movie app. The `/series` page must:

1. Reuse `MovieRow`, `MovieCard`, and `MovieDetailModal` wherever possible
2. Add TV-specific TMDB API calls (different namespace, different field names)
3. Surface K-Drama and C-Drama as distinct curated rows
4. Avoid building anything that belongs in a later milestone

The existing app already handles: search, genre filtering, infinite scroll, watchlist actions, streaming providers, cast display, and detail modals — all for movies. TV series reuses the same visual scaffolding with data-layer adaptations.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist on a TV series page. Missing any of these makes the page feel incomplete compared to Netflix or JustWatch.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Trending TV row | Netflix/JustWatch lead with trending — users orient by what's popular right now | LOW | TMDB `/trending/tv/week` — direct analog to existing movie trending |
| Top Rated row | Standard discovery anchor — users look for critically vetted content | LOW | TMDB `/tv/top_rated` — direct analog |
| Korean Drama (K-Drama) row | Huge global demand; Netflix dedicates entire rows and landing pages to K-Drama | MEDIUM | TMDB `/discover/tv?with_origin_country=KR&sort_by=popularity.desc` — requires new query param pattern |
| Chinese Drama (C-Drama) row | Significant audience, particularly in Southeast Asia; platforms like WeTV and Viu focus on this | MEDIUM | TMDB `/discover/tv?with_origin_country=CN&sort_by=popularity.desc` |
| TV show detail modal | Users click cards expecting details — without it the page feels broken | MEDIUM | Adapts existing `MovieDetailModal`. Key difference: replace `runtime` with seasons/episodes count, replace director with creator/showrunner |
| Watchlist add/remove for TV shows | Users expect to save shows just like movies — no functional gap | LOW | Existing watchlist schema stores `tmdbId` + `title` + `posterPath` — works unchanged for TV IDs |
| Watch providers (streaming) | JustWatch powers this; users choose shows partly by where to stream | LOW | TMDB `append_to_response=aggregate_credits,watch/providers` for TV — same structure as movie providers |
| Loading skeletons | App already has skeleton states; TV page must match | LOW | Reuse existing skeleton components |

### Differentiators (Competitive Advantage)

Features that distinguish Moodflix's TV experience from a plain TMDB wrapper.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| K-Drama and C-Drama as first-class rows (not genre filters) | Most Western apps bury Asian content under "International" — making K-Drama and C-Drama their own named rows signals that Moodflix respects this audience | LOW | The curated row label ("Korean Drama", "Chinese Drama") is the differentiator — the TMDB query is the same complexity as any discover call |
| Season/episode count in detail modal | Users deciding whether to commit to a show care deeply about length — "Should I start this 80-episode C-Drama?" — movies don't have this problem | LOW | TMDB TV detail includes `number_of_seasons` and `number_of_episodes` — display alongside runtime |
| Show status badge (Returning / Ended) | Letterboxd doesn't surface this; Netflix hides it — users hate starting a cancelled show | LOW | TMDB `status` field: "Returning Series", "Ended", "Cancelled" — show as a badge in the modal |
| Network/streaming origin label | Knowing a show is a "Netflix Original" or "HBO" before opening the modal adds context | MEDIUM | TMDB `networks` array on TV details — display top network name in modal |
| Series vs. miniseries distinction | A 6-episode limited series has completely different commitment than an ongoing drama | LOW | Derive from `number_of_seasons === 1 && status === "Ended"` → label "Miniseries" |

### Anti-Features (Commonly Requested, Often Problematic)

Features to explicitly NOT build in v0.3. Document reasoning so the team doesn't revisit them mid-sprint.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Episode-level tracking ("I'm on S2E5") | Power users on Reddit and X frequently request this for apps like Serializd and TVTime | Requires new schema table (`episode_progress`), new API calls per episode, fundamentally different UX than simple "watched/want to watch" — this is a v1.0+ feature | Watchlist `status` already covers "watching" intent; `number_of_episodes` in modal gives users enough to self-track externally |
| Season-by-season watchlist | Natural follow-on to episode tracking | Same problem — schema explosion, no TMDB season-level watchlist data, complex state management | Show season count in modal; let users mark the show as watched/want to watch at the show level |
| TV-specific genre filters on /series page | Users on /discover already have genre filters | TV genres have different IDs than movie genres (TMDB assigns separate genre lists) — building a TV genre filter requires a second genre map and a separate discover endpoint; high complexity for low v0.3 value | Use country-based rows (K-Drama, C-Drama) as the curation mechanism for v0.3; defer genre filters to v0.4 |
| Separate /series search | "Search for shows" feels expected | The existing `/discover` page searches movies only; adding a parallel search on `/series` doubles the API proxy surface and creates UI duplication | Add TV search to `/discover` page in a later milestone that unifies discovery |
| AI mood recommendations for TV | Natural extension of the existing AI feature | Requires expanding the AI prompt, changing genre ID handling (TV genre IDs differ from movie IDs), and updating the recommendations grid — this is a separate milestone of work | AI tab on `/home` remains movie-only in v0.3; flag for v0.4 |
| Trailer playback | Users on JustWatch see trailer buttons | Requires YouTube embed or TMDB video API integration, cross-origin complexity, and autoplay policies — significant surface area | Show "Where to Watch" providers (already built) as the action hook |

---

## Feature Dependencies

```
[TMDB TV API types (TVShow, TVDetails)]
    └──required by──> [Trending TV row]
    └──required by──> [K-Drama row]
    └──required by──> [C-Drama row]
    └──required by──> [Top Rated row]
    └──required by──> [TV Detail Modal]

[TV API proxy routes (/api/series)]
    └──required by──> [All client-side TV hooks]

[TV client hooks (use-series.ts)]
    └──required by──> [SeriesContent client component]

[SeriesContent component]
    └──required by──> [/series page]

[TV Detail Modal]
    └──enhances──> [Trending TV row]
    └──enhances──> [K-Drama row]
    └──enhances──> [C-Drama row]
    └──enhances──> [Top Rated row]

[Watchlist actions] ──already built──> [TV show add/remove]
    (tmdbId is media-type-agnostic in current schema)

[MovieCard] ──reused as-is──> [TV show cards]
    (poster_path, vote_average, genre_ids all present in TV list response)
    (name → title adapter needed in data layer)

[MovieRow] ──reused as-is──> [All series rows]
```

### Dependency Notes

- **TV types must be defined first:** `TVShow` (list item) and `TVDetails` (detail) types must exist before any hooks or components. The critical difference: TV uses `name` not `title`, `first_air_date` not `release_date`. An adapter function that maps `TVShow` to the existing `Movie` type shape (swapping `name → title`, `first_air_date → release_date`) enables full `MovieCard` and `MovieRow` reuse without touching those components.
- **API proxy routes are the single new backend surface:** One new route group (`/api/series`) handles all TV fetch variants — trending, top rated, country discover. This mirrors the existing `/api/movies` pattern exactly.
- **Watchlist works unchanged:** The Drizzle `watchlist` table stores `tmdbId` as an integer — TMDB movie and TV IDs exist in separate namespaces (no collisions), but the app currently has no `mediaType` column. This means if movie ID 1396 and TV show ID 1396 both existed, they would conflict. TMDB IDs rarely overlap in practice, but this is a known technical debt item to address before scaling.
- **TV Detail Modal is the only new component:** All other visual components (`MovieCard`, `MovieRow`, `MovieGrid`) can be reused. The TV modal needs season/episode count, show status, and network — fields absent from `MovieDetails`.

---

## TV vs. Movie: Data Differences

This section directly answers the TMDB API structure question, which is critical for implementation.

### TMDB TV List Item vs. Movie List Item

| Field | Movie | TV Show | Adapter Action |
|-------|-------|---------|---------------|
| `title` | Present | `name` | Map `name → title` |
| `release_date` | Present | `first_air_date` | Map `first_air_date → release_date` |
| `original_title` | Present | `original_name` | Map `original_name → original_title` |
| `video` | Present (bool) | Absent | Default to `false` |
| `adult` | Present (bool) | Present | No change |
| `genre_ids` | Present | Present (different IDs) | TV genre map needed |
| `poster_path` | Present | Present | No change |
| `backdrop_path` | Present | Present | No change |
| `vote_average` | Present | Present | No change |
| `vote_count` | Present | Present | No change |
| `overview` | Present | Present | No change |
| `popularity` | Present | Present | No change |
| `origin_country` | Absent | Present (array) | New field on TVShow type |
| `original_language` | Present | Present | No change |

**Recommendation:** Create a `TVShow` type that mirrors `Movie` but uses the TV field names. Add an `adaptTVShowToMovie(show: TVShow): Movie` function in `lib/tmdb.ts` that performs the field renames. This lets `MovieCard` and `MovieRow` consume TV data without modification. Mark adapted items with a `mediaType: 'tv'` discriminant on a separate `MediaItem` union type if the watchlist collision risk needs to be addressed.

### TMDB TV Detail vs. Movie Detail

| Field | Movie Detail | TV Detail | Notes |
|-------|-------------|-----------|-------|
| `runtime` | Single number (minutes) | `episode_run_time` (number array) | Use `episode_run_time[0]` as approximation |
| `credits` | `crew` includes Director | `aggregate_credits` | TV uses `aggregate_credits` — `crew` array has roles differently structured |
| `created_by` | Absent | Present (array of creators) | Display creator(s) instead of director |
| `number_of_seasons` | Absent | Present | Display in modal |
| `number_of_episodes` | Absent | Present | Display in modal |
| `status` | Present (Released, etc.) | Present (Returning Series, Ended, Cancelled, In Production) | Display as badge |
| `networks` | Absent | Present (array) | Display primary network |
| `seasons` | Absent | Present (array with season details) | Don't use in v0.3 |
| `tagline` | Present | Present | No change |
| `genres` | Movie genre objects | TV genre objects (different IDs) | TV detail returns full genre names — no mapping needed for detail view |
| `watch/providers` | Present (append) | Present (append) — same structure | No change |
| `budget` / `revenue` | Present | Absent | Not shown for TV |

### K-Drama and C-Drama: Country vs. Language Filter

**Answer: Use `with_origin_country` (not language).**

- `with_original_language=ko` catches Korean-language content regardless of origin country. This would include Korean-language productions from outside Korea (rare, but possible noise).
- `with_origin_country=KR` targets shows produced in South Korea specifically. This is how Netflix, JustWatch, and Letterboxd all categorize K-Drama — by production origin, not language.
- `with_origin_country=CN` targets Mainland China productions. Note: `TW` (Taiwan) and `HK` (Hong Kong) are separate origin codes. C-Drama in the Moodflix context should mean Mainland China (`CN`). Taiwanese dramas (`TW`) are a separate but related category — do not combine with `CN` in v0.3, as they have different cultural associations and audience expectations.
- Language-based filtering (`with_original_language`) produces inconsistent results for drama discovery because TMDB's language tagging is less reliable than country-of-origin tagging.

**Confidence:** HIGH — TMDB's `/discover/tv` API documents both `with_origin_country` and `with_original_language` parameters. The `with_origin_country` parameter accepts ISO 3166-1 alpha-2 codes (KR, CN, TW, JP, etc.).

### Streaming Providers for TV vs. Movies

- TMDB's `watch/providers` response structure is **identical** for TV and movies
- The same JustWatch-powered data is returned: `flatrate`, `rent`, `buy` arrays with `logo_path`, `provider_id`, `provider_name`
- Providers like Netflix, Prime Video, Disney+, and regional platforms (WeTV, Viu) all appear for TV shows where available
- The existing `ProviderGrid` component and `PROVIDER_URLS` constant in `lib/constants.ts` work without modification
- K-Dramas stream primarily on Netflix, Viki (not yet in `PROVIDER_URLS`), and Kocowa — consider adding provider IDs 234 (Viki) and 443 (Kocowa) to `PROVIDER_URLS` for a better TV experience

---

## TV Genre IDs (TMDB)

TV genres use different IDs than movie genres. The existing `GENRES` constant in `lib/constants.ts` is movie-only. A separate `TV_GENRES` map is needed for the series page genre display on cards.

| ID | Genre |
|----|-------|
| 10759 | Action & Adventure |
| 16 | Animation |
| 35 | Comedy |
| 80 | Crime |
| 99 | Documentary |
| 18 | Drama |
| 10751 | Family |
| 10762 | Kids |
| 9648 | Mystery |
| 10763 | News |
| 10764 | Reality |
| 10765 | Sci-Fi & Fantasy |
| 10766 | Soap |
| 10767 | Talk |
| 10768 | War & Politics |
| 37 | Western |

Note: Some IDs overlap with movies (16=Animation, 35=Comedy, 18=Drama, 80=Crime, 99=Documentary, 9648=Mystery, 37=Western). Others are TV-exclusive (10759, 10762–10768). The overlap means the existing `GENRES` map accidentally works for shared IDs, but TV-exclusive genres need the new `TV_GENRES` map.

**Confidence:** HIGH — TMDB genre IDs are stable and documented in official API reference.

---

## MVP Definition

### Launch With (v0.3)

Minimum viable `/series` page that validates the concept and delivers the K-Drama/C-Drama row value.

- [ ] **`TVShow` type and TMDB TV fetch functions** — foundation for everything; no page renders without it
- [ ] **`/api/series` proxy route** — server-side TMDB calls with ISR cache (5 min, matching movie pattern)
- [ ] **`use-series.ts` hooks** — TanStack Query hooks for trending, top rated, country discover; mirrors `use-movies.ts`
- [ ] **TV adapter function** — `adaptTVShowToMovie()` enables `MovieCard` and `MovieRow` reuse without component changes
- [ ] **`/series` page** with four rows: Trending TV, K-Drama, C-Drama, Top Rated Series
- [ ] **TV Detail Modal** — adapts existing modal with: seasons/episodes count, show status badge, creator(s) instead of director, network label
- [ ] **`TV_GENRES` constant** — enables genre badge display on cards for TV-specific genre IDs
- [ ] **Viki and Kocowa provider URLs** — adds completeness for K-Drama streaming providers

### Add After Validation (v0.4)

Features to add once the `/series` page is live and used.

- [ ] TV search integration on `/discover` — unifies movie and TV search
- [ ] TV genre filter row on `/series` — adds filter parity with `/discover`
- [ ] Japanese Anime row — `with_origin_country=JP` with genre filter `with_genres=16` (Animation)
- [ ] Taiwanese Drama row — `with_origin_country=TW`
- [ ] AI mood recommendations for TV — extends existing AI endpoint with TV genre IDs

### Future Consideration (v1.0+)

- [ ] Episode-level progress tracking — requires schema changes, new UI
- [ ] Season-by-season watchlist — requires schema changes
- [ ] Show notifications ("new season out") — requires push notifications or email

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| `TVShow` types + adapter | HIGH | LOW | P1 |
| `/api/series` proxy route | HIGH | LOW | P1 |
| `use-series.ts` hooks | HIGH | LOW | P1 |
| Trending TV row | HIGH | LOW | P1 |
| K-Drama row | HIGH | LOW | P1 |
| C-Drama row | HIGH | LOW | P1 |
| Top Rated row | MEDIUM | LOW | P1 |
| TV Detail Modal | HIGH | MEDIUM | P1 |
| `TV_GENRES` constant | MEDIUM | LOW | P1 |
| Show status badge | MEDIUM | LOW | P2 |
| Season/episode count | HIGH | LOW | P1 |
| Network label | MEDIUM | LOW | P2 |
| Viki/Kocowa providers | LOW | LOW | P2 |
| TV search | HIGH | MEDIUM | P3 (v0.4) |
| TV genre filters | MEDIUM | MEDIUM | P3 (v0.4) |
| Episode tracking | HIGH | HIGH | P3 (v1.0+) |

---

## Competitor Feature Analysis

| Feature | Netflix | JustWatch | Letterboxd | Our Approach |
|---------|---------|-----------|------------|--------------|
| K-Drama curation | Dedicated "Korean Dramas" row on homepage | Country filter ("South Korea") + genre filters | No dedicated section | Named row "Korean Drama" — higher signal than a filter |
| C-Drama curation | Buried in "International" or "Chinese" row | Country filter ("China") | No dedicated section | Named row "Chinese Drama" — first-class treatment |
| Show status (Returning/Ended) | Hidden — you find out when no new season appears | Shows current season + "New Season" badge | Shown on series page | Status badge in detail modal — proactive signal |
| Season/episode count | Shown in detail | Shown in detail | Shown on series page | Display in TV detail modal |
| Streaming providers | Own content only | Full JustWatch data | None | Full JustWatch via TMDB (already built) |
| TV genre filters | Category rows (not explicit filters) | Genre + country multi-filter | Genre tags | Defer to v0.4; v0.3 uses curated rows |
| Episode tracking | Watch history | None | Episode-level (Letterboxd for TV) | Out of scope v0.3 |
| Director equivalent | Creator listed | Showrunner listed | Creator listed | Display `created_by` from TMDB TV detail |

---

## Sources

- TMDB API documentation (TV series endpoints, discover parameters, TV detail fields) — HIGH confidence from training knowledge; verify `aggregate_credits` vs `credits` behavior in implementation
- Netflix web app — K-Drama and C-Drama row UX patterns observed directly (MEDIUM confidence)
- JustWatch — country filter and show status display patterns (MEDIUM confidence)
- Letterboxd — no TV-specific discovery (confirmed: Letterboxd is film-only as of training cutoff)
- Existing Moodflix codebase (`lib/tmdb.ts`, `types/movie.ts`, `hooks/use-movies.ts`, `components/movies/`) — HIGH confidence, read directly

### Confidence Gaps Requiring Verification

1. **`aggregate_credits` vs `credits` for TV:** TMDB TV details support both `credits` (simplified) and `aggregate_credits` (full season-spanning cast). Training knowledge says `aggregate_credits` is preferred for TV — **verify against current TMDB API docs before implementation**.
2. **Watchlist TMDB ID collision:** Movie and TV share integer ID spaces in TMDB, and TMDB IDs are assigned from separate pools (movies from `/movie/*`, TV from `/tv/*`) — they can technically collide. **Verify whether the current schema needs a `mediaType` discriminant column before adding TV shows to watchlist**.
3. **Viki provider ID:** 234 cited from training knowledge — **verify in TMDB provider list before adding to `PROVIDER_URLS`**.
4. **Kocowa provider ID:** 443 cited from training knowledge — **verify in TMDB provider list before adding to `PROVIDER_URLS`**.

---

*Feature research for: TV series discovery (v0.3 milestone — Moodflix)*
*Researched: 2026-02-19*
