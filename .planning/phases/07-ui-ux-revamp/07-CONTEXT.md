# Phase 7: UI/UX Revamp - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace top navbar with sidebar navigation, update color scheme to warmer tones, adopt Stremio-inspired layout patterns across detail views and browse pages, and fully redesign the landing page with scroll-driven animations. All existing features (home, discover, series, library, detail modal, AI mood section) must remain fully functional.

</domain>

<decisions>
## Implementation Decisions

### Sidebar Navigation
- Expandable sidebar: icon-only (~60px) by default, expands to show labels (~200px) on hover
- Hover-to-expand behavior (no click/pin toggle) — expands on mouse enter, collapses on mouse leave
- Mobile/tablet: bottom tab bar with 4 icons (Home, Discover, Series, Library) — standard one-thumb reachable pattern
- Moodflix logo at top of sidebar: icon when collapsed, full "Moodflix" text when expanded
- User profile/avatar at bottom of sidebar with dropdown (logout, settings)
- Same 4 nav items as current: Home, Discover, Series, Library
- No search in sidebar — search stays on Discover page only
- No AI nav item — AI mood section stays on /home page only
- Active nav indicator: crimson highlight bar/pill on the active item

### Color Scheme & Accent
- Keep crimson/red accent: `oklch(0.637 0.237 25.331)` — no change to brand color
- Shift backgrounds to **warmer tinted dark** for cozy cinema feel:
  - Background: `oklch(0.13 0.008 25)` (~#1a1512)
  - Card: `oklch(0.16 0.01 25)` (~#221a16)
  - Muted: `oklch(0.26 0.01 25)` (~#332a26)
  - Border: `oklch(1 0.01 25 / 10%)` (warm-white/10%)
- Sidebar background slightly darker than page: `oklch(0.11 0.008 25)` for visual separation
- Active nav uses crimson highlight bar/pill

### Detail View — Full Page + Search Modal
- **Major change**: Movie/TV detail moves from modal-only to a **dedicated page route** (`/movie/[id]`, `/tv/[id]`)
- Full page for all main browsing contexts (home rows, discover grid, series, library) — enables shareable URLs
- Search results on Discover page still use a **compact modal/drawer** for quick preview, with "View Full Details" link to the full page
- Full page layout follows Stremio (Revamp-UI-1) structure but **single-column full-width** (not two-column):
  - Full-bleed backdrop image at top with gradient fade
  - Title overlay on backdrop
  - Pill badges for metadata: [runtime] [year] [rating]
  - Pill tags for genres
  - Pill chips for cast names
  - Director section
  - Summary text
  - Watch providers section
  - Fixed bottom action bar: [Add to Library] [Trailer] [Like/Dislike]
- Below main info, 4 additional sections:
  1. More Like This row (TMDB recommendations)
  2. Cast photo grid (expandable, with profile photos + character names)
  3. Watch providers section (streaming, rent, buy with logos)
  4. Reviews/ratings (TMDB user reviews or rating distribution)

### Browse/Grid Layout
- Discover page switches from horizontal scroll rows to **grid layout with filter dropdowns**
- Series page also adopts the same grid+filters layout (consistent with Discover)
- Filter bar includes: Genre dropdown, Sort by (popularity/rating/date/title), Year/decade filter
- No Category dropdown — removed for simplicity
- Infinite scroll grid for results
- Home page keeps current layout unchanged: hero + trending row + personalized rows + AI mood + feature cards

### Landing Page (/)
- **Full redesign** — unique, rich, makes users want to stay
- Scroll-driven animations using GSAP (ScrollTrigger) — allowed to use GSAP for this
- Animation/visual references:
  - https://www.generalintelligencecompany.com/ — Lottie animations, staggered reveals, scale transforms, stroke animations, color transitions, scroll triggers with parallax
  - https://www.farmminerals.com/ — GSAP ScrollTrigger frame-by-frame scroll animation, split text character reveals, Lenis smooth scroll, section-based color shifts, progressive disclosure
- Design references collected in `references/landing-page/`:
  - `01-dribbble-movie-landing-pages.png` — Dribbble collection overview
  - `02-behance-streaming-landing-pages.png` — Behance streaming landing pages
  - `03-awwwards-film-tv.png` — Awwwards Film & TV award winners
- More visual references to be gathered in next session for user review before implementation

### Claude's Discretion
- Exact GSAP animation choreography and timing
- Sidebar transition animation details (easing, duration)
- Bottom tab bar design on mobile (icon style, active indicator)
- Filter dropdown component implementation
- Detail page responsive breakpoints
- Search modal/drawer design details
- Landing page section structure and content flow (pending more reference gathering)

</decisions>

<specifics>
## Specific Ideas

- "I want something unique, rich, and makes the user want to stay" (landing page)
- Stremio Revamp-UI-1 as the primary detail page layout reference (but tweak it — "Stremio is a bit too boring and empty")
- Full-width single column for detail page, not two-column split
- "More Like This" row below detail info to keep users browsing
- GSAP is allowed for landing page animations (exception to Framer Motion convention)
- generalintelligencecompany.com and farmminerals.com as animation quality benchmarks
- Warm cinema palette — "cozy" feel cohesive with crimson brand

</specifics>

<deferred>
## Deferred Ideas

- Share functionality on detail pages — noted as a reason for the page route decision, but actual share button/feature is a future phase
- Settings page — user profile dropdown includes "settings" but the page itself is not in scope

</deferred>

---

*Phase: 07-ui-ux-revamp*
*Context gathered: 2026-02-23*
