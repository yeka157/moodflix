# Requirements: Moodflix

**Defined:** 2026-02-28
**Core Value:** Users can discover movies and TV shows that match their mood and manage what they've watched — the library and discovery experience must feel instant and intuitive.

## v0.4 Requirements

Requirements for v0.4 Watchlist & Polish milestone. Each maps to roadmap phases.

### TV Watchlisting

- [ ] **TVWL-01**: User can add a TV show to their library from the TV detail page (/tv/[id])
- [ ] **TVWL-02**: User can mark a TV show as "watched" from the TV detail page
- [ ] **TVWL-03**: User can like/dislike a TV show from the TV detail page
- [ ] **TVWL-04**: User can remove a TV show from their library
- [ ] **TVWL-05**: Library cards for TV shows link to /tv/[id] (not /movie/[id])
- [ ] **TVWL-06**: Library cards display a "TV" or "Movie" type badge for content identification
- [ ] **TVWL-07**: Schema migration adds media_type column to watchlist table with DEFAULT 'movie' backfill
- [ ] **TVWL-08**: Unique constraint updated to (userId, tmdbId, mediaType) — movie and TV with same TMDB ID can coexist

### Watchlist UX

- [ ] **WLUX-01**: Watchlist state (bookmark/watched icons) updates instantly on all movie/TV cards across pages after a mutation — no refresh needed (BACKLOG-16)
- [ ] **WLUX-02**: Adding to watchlist or changing status does not remove the card from the current grid view — flags sync in place (BACKLOG-23)
- [ ] **WLUX-03**: Library page has a media type filter (All / Movies / TV Shows) alongside existing status tabs (BACKLOG-32)

### Discovery UX

- [ ] **DISC-01**: TV series page has a search bar for searching TV shows (BACKLOG-31)
- [ ] **DISC-02**: Sidebar nav label "Discover" renamed to "Movies" (route /discover unchanged) (BACKLOG-31)
- [ ] **DISC-03**: TMDB rating displayed as "X.X/10" format instead of ambiguous star rating — only shown when vote_count > 10 (BACKLOG-25)

### AI Polish

- [ ] **AIPOL-01**: AI recommendations support origin country filtering — "K-drama comedy" returns Korean TV comedies, not generic TV comedies
- [ ] **AIPOL-02**: AI suggest_genres tool outputs optional origin_country (ISO 3166-1 alpha-2 code) when user requests country-specific content
- [ ] **AIPOL-03**: Origin country parameter propagates through recommendations page URL to TMDB discover API call
- [ ] **AIPOL-04**: AI chatbot restricts off-topic queries — redirects non-movie/TV questions back to mood discovery without being hostile
- [ ] **AIPOL-05**: Full AI conversation (all user + assistant messages) logged to database for analytics when genre suggestion is made
- [ ] **AIPOL-06**: AI conversation logging is fire-and-forget — does not add latency to streaming response

### My Top 100

- [ ] **TOP-01**: User can create a personal "My Top 100" ranked list of movies and TV shows
- [ ] **TOP-02**: User can add a movie or TV show to their Top 100 from the detail page or library
- [ ] **TOP-03**: User can remove an item from their Top 100
- [ ] **TOP-04**: User can reorder items in their Top 100 using move up/down controls
- [ ] **TOP-05**: Top 100 list enforces maximum 100 items per user
- [ ] **TOP-06**: Same movie/TV show cannot be added twice to Top 100
- [ ] **TOP-07**: Top 100 accessible as a tab within the library page or a sub-route (/library/top-100)

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### TV Enhancements

- **TVFUT-01**: Episode-level progress tracking (S2E5 status per show)
- **TVFUT-02**: Season-by-season watchlist status
- **TVFUT-03**: Japanese Anime row on /series page (origin_country=JP + genre=Animation)
- **TVFUT-04**: Taiwanese Drama row on /series page

### AI Enhancements

- **AIFUT-01**: Premium AI rate limits (100 req/day)
- **AIFUT-02**: AI admin dashboard for analytics viewing

### Social

- **SOCFUT-01**: Public profile with shared Top 100 list
- **SOCFUT-02**: Social sharing of watchlist/Top 100

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Drag-and-drop reorder for Top 100 | DnD libraries conflict with Framer Motion; use move up/down buttons instead |
| Route rename /discover → /movies | Breaking change for bookmarks; label-only rename is sufficient |
| Passkey/WebAuthn login | Requires Supabase MFA config — on hold |
| Apple Sign In | No Apple Developer Program membership |
| Mobile native app | Web-only for now |
| Premium tier / payments | Not for v0.4 |
| AI conversation logging for non-recommendation chats | Only log when genre suggestion is produced |
| TMDB origin_country on /search/tv | TMDB search API does not support this parameter — only works on /discover/tv |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TVWL-01 | — | Pending |
| TVWL-02 | — | Pending |
| TVWL-03 | — | Pending |
| TVWL-04 | — | Pending |
| TVWL-05 | — | Pending |
| TVWL-06 | — | Pending |
| TVWL-07 | — | Pending |
| TVWL-08 | — | Pending |
| WLUX-01 | — | Pending |
| WLUX-02 | — | Pending |
| WLUX-03 | — | Pending |
| DISC-01 | — | Pending |
| DISC-02 | — | Pending |
| DISC-03 | — | Pending |
| AIPOL-01 | — | Pending |
| AIPOL-02 | — | Pending |
| AIPOL-03 | — | Pending |
| AIPOL-04 | — | Pending |
| AIPOL-05 | — | Pending |
| AIPOL-06 | — | Pending |
| TOP-01 | — | Pending |
| TOP-02 | — | Pending |
| TOP-03 | — | Pending |
| TOP-04 | — | Pending |
| TOP-05 | — | Pending |
| TOP-06 | — | Pending |
| TOP-07 | — | Pending |

**Coverage:**
- v0.4 requirements: 27 total
- Mapped to phases: 0
- Unmapped: 27 ⚠️

---
*Requirements defined: 2026-02-28*
*Last updated: 2026-02-28 after initial definition*
