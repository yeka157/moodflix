# Phase 8: Landing Page Revamp - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign the public-facing landing page to match the current app identity (sidebar nav, warmer color scheme, all features shipped through v0.3) and convert visitors into signups. The current landing page was built in v0.1 and hasn't been updated since the UI/UX revamp.

</domain>

<decisions>
## Implementation Decisions

### Visual Direction
- Cinematic dark theme — dark backgrounds, movie backdrop imagery, crimson accents
- Netflix/Stremio-inspired landing page aesthetic
- Must feel premium and entertainment-focused, not generic SaaS

### Hero Section
- Combination: cinematic movie backdrop as atmosphere + real app screenshot layered on top
- The backdrop sets the mood, the screenshot proves the product is real
- Hero should immediately communicate "this is a movie app"

### Feature Highlights
- All 4 core features highlighted equally:
  1. AI Mood Discovery — the unique differentiator, describe your mood and get recommendations
  2. Movie & TV Browse — TMDB-powered discover with filters, genres, infinite scroll
  3. Personal Library — watchlist with instant status updates, like/dislike ratings
  4. TV Series (K-Drama/C-Drama) — Korean/Chinese drama discovery, series detail pages

### Animation Approach
- World-class scroll-triggered animations — rich but not excessive
- Scroll-triggered section reveals, parallax hero, animated feature transitions
- Cinematic feel that matches the entertainment brand
- Must feel polished and intentional, not "animation for animation's sake"

### Claude's Discretion
- **Animation library**: GSAP vs Framer Motion — choose whichever delivers the best cinematic scroll experience for the landing page. If GSAP is used, it's landing-page-only (Framer Motion stays for the rest of the app)
- **Section order and storytelling flow**: Prioritize storytelling that makes the app's value immediately obvious. Classic flow (Hero → Features → AI Demo → CTA) is a starting point but optimize for narrative impact
- **CTA strategy**: Choose the approach that best converts — single hero CTA + bottom repeat, multiple CTAs, or sticky bar. Prioritize clean design over aggressive conversion tactics
- **Content copy**: Write compelling headlines and descriptions that match the cinematic brand
- **Screenshot selection**: Which app screens to showcase in the hero and feature sections

</decisions>

<specifics>
## Specific Ideas

- Hero: movie backdrop with real app screenshot overlaid — atmosphere + proof
- Animation should be "world class level" but "not too extra" — think Apple product pages or Stripe's landing page animations
- The landing page should tell the story of the app — not just list features
- All 4 features (AI mood, browse, library, TV series) must be represented
- Current landing page components live in `components/landing/` — hero-section.tsx, features-section.tsx, etc.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-landing-page-revamp*
*Context gathered: 2026-02-27*
