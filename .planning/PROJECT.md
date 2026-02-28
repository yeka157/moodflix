# Moodflix

## What This Is

A movie and TV series watchlist and recommendation app with AI-powered mood-based discovery. Users browse movies and TV shows via TMDB, manage a personal library with instant optimistic updates, and get AI-generated genre recommendations based on their current mood. Features sidebar navigation, Stremio-inspired detail pages, and a cinematic landing page. Built with Next.js 16, Supabase, and Google Gemini. Deployed on Vercel.

## Core Value

Users can discover movies and TV shows that match their mood and manage what they've watched — the library and discovery experience must feel instant and intuitive.

## Current State

**Shipped version:** v0.3 Content Expansion (2026-02-28)
**Next milestone:** TBD — use `/gsd:new-milestone` to plan

## Requirements

### Validated

- ✓ Landing page with feature showcase and AI preview — Phase 1 (original)
- ✓ Email/password and Google OAuth authentication — Phase 3 (original)
- ✓ Protected app routes with session management — Phase 3 (original)
- ✓ Home page with hero banner, trending movies, and feature cards — Phase 4 (original)
- ✓ Movie discovery with search, genre filters, and infinite scroll — Phase 5 (original)
- ✓ Movie detail modal with backdrop, cast, watch providers — Phase 5 (original)
- ✓ Regional watch provider data via country detection — Phase 5 (original)
- ✓ Watchlist CRUD with status tracking (want to watch/watched) — Phase 6 (original)
- ✓ Like/dislike rating system on watchlist items — Phase 6 (original)
- ✓ AI mood-based chat with streaming responses and genre suggestions — Phase 7 (original)
- ✓ AI recommendation results page with infinite scroll — Phase 7 (original)
- ✓ Rate limiting on AI endpoints (10 req/day) — Phase 7 (original)
- ✓ Error boundaries for all app routes — Polish (original)
- ✓ SEO, OG images, and structured data — Polish (original)
- ✓ Watchlist mutations update UI instantly across all components (WATCH-R01) — v0.2 Phase 1
- ✓ One-tap "Mark as Watched" on movie cards and detail modal (WATCH-R02) — v0.2 Phase 1
- ✓ Distinct icons per status — Bookmark (want to watch), CircleCheck (watched) (WATCH-R03) — v0.2 Phase 1
- ✓ Like/dislike rating changes reflect immediately (WATCH-R04) — v0.2 Phase 1
- ✓ Moodflix logo + film-strip M icon, Bebas Neue display font, all placements (BRAND-01) — v0.2 Phase 2
- ✓ Favicon set + PWA manifest icons (16px–512px) (BRAND-02) — v0.2 Phase 2
- ✓ OG images for social sharing — global + /home + /discover (BRAND-03) — v0.2 Phase 2
- ✓ Framer Motion page transitions + crimson NProgress bar + spring navbar pill (POLSH-01) — v0.2 Phase 3
- ✓ Responsive layouts tested at 375px, 768px, 1280px — 44px touch targets (POLSH-02) — v0.2 Phase 3
- ✓ Keyboard navigation + WCAG 2.1 AA contrast confirmed (POLSH-03) — v0.2 Phase 3
- ✓ Zero lint warnings, zero TypeScript errors — clean production build (POLSH-04) — v0.2 Phase 3
- ✓ TV Series discovery page with K-Drama, C-Drama, Top Rated rows and TV detail modal (TV-01) — v0.3 Phases 4-5
- ✓ Skeleton loading color uses neutral muted tone (SKEL-01) — v0.3 Phase 6
- ✓ Homepage personalized rows rotate daily from top-5 pool with varied sentence phrasing (HOME-01) — v0.3 Phase 6
- ✓ Sidebar navigation replacing top navbar with hover-expand + mobile bottom tab bar (REVAMP-01) — v0.3 Phase 7
- ✓ Stremio-inspired full-page detail views for movies and TV shows — v0.3 Phase 7
- ✓ Discover and Series grid layouts with genre/sort/year filter dropdowns — v0.3 Phase 7
- ✓ AI model upgrade to Gemini 2.5 Flash Lite with quota error handling — v0.3 Phase 07.1
- ✓ Settings page with profile display and username editing — v0.3 Phase 07.1
- ✓ Cinematic landing page with parallax hero, TMDB poster marquee, AI preview, CTA — v0.3 Phase 8

### Active

(None — define in next milestone via `/gsd:new-milestone`)

### Out of Scope

- Passkey/WebAuthn login — on hold, requires Supabase MFA config
- Auth form refactor to shadcn FormField — low priority, works fine as-is
- Apple Sign In — no Apple Developer Program membership
- Mobile native app — web-only
- Premium tier / payments — not for v1
- Real-time collaborative features — not needed for personal watchlist
- "My Top 100" personal list (FUTURE-02) — future feature
- Premium AI rate limits (FUTURE-03) — future feature
- TV show watchlisting — requires schema migration (media_type column)
- AI mood recommendations for TV shows — deferred

## Context

- **Codebase state:** v0.3 shipped. ~13,844 lines of TypeScript/TSX across 130+ files. Build clean, lint clean.
- **Deployment:** Deployed on Vercel via main branch auto-deploy.
- **Known issues:** None at v0.3.
- **Tech debt:** Phase 08 Task 2 visual verification was accepted without formal checkpoint sign-off.

## Constraints

- **Tech stack**: Next.js 16 + React 19 + Tailwind v4 + shadcn/ui — locked in, no changes
- **Database**: Supabase PostgreSQL with Drizzle ORM — no schema redesign, only additive changes if needed
- **Auth**: Supabase Auth — no changes to auth flow
- **AI**: Google Gemini via AI SDK v5 — no changes to AI pipeline
- **Animations**: Framer Motion only — no GSAP or other animation libraries
- **Accessibility**: WCAG 2.1 AA minimum
- **Touch targets**: 44x44px minimum on mobile

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Two action buttons instead of status dropdown | Faster UX — bookmark for "want to watch", CircleCheck for "watched". Eliminates extra click. | ✓ Good — shipped in v0.2 Phase 1 |
| Remove `watching` status from schema entirely | Rarely used, simplifies schema and UI. Cards focus on two primary states. | ✓ Good — Drizzle migration applied, no regressions |
| Fix optimistic updates at query key level | Root cause was stale cache invalidation — `WatchlistTmdbEntry` enriched with `status` field enables direct card updates. | ✓ Good — instant UI across all components |
| Route rename `/watchlist` → `/library` | Better matches the "my library" mental model. Backwards-compat redirect added. | ✓ Good — 13+ files updated, redirect works |
| SVG perforations as rect overlays with bg color | True SVG clip-path cutouts would break dark backgrounds. Rect overlay using #0a0a0a is simpler and reliable. | ✓ Good — perforations render correctly across all surfaces |
| Bebas Neue 400 only (no bold/italic) | Single-weight display font keeps bundle lean. Framer Motion spring handles emphasis. | ✓ Good |
| Hex #FB2C36 in SVG fills (not oklch) | SVG fill attributes don't support oklch. Hex is the spec-safe option. | ✓ Good |
| OG images use woff (not woff2) | Satori in Next.js 16 silently fails on woff2. woff loads correctly. | ✓ Good — critical bug avoided |
| template.tsx entry-only animation | App Router breaks AnimatePresence exit animations. Entry-only via template.tsx is the correct pattern. | ✓ Good |
| `layoutId` omitted entirely when reduced-motion | Setting duration=0 still runs layout animation code path. Omitting prop skips it entirely. | ✓ Good — a11y compliant |
| `[@media(hover:none)]` for touch targets | Touch-specific 44px sizing without affecting desktop hover experience. | ✓ Good |
| CTA card frame on landing page | Explicit bg/border/radius gives CTA its own visual bounding box, preventing optical centering illusion from asymmetric section above. | ✓ Good |
| normalizeTVShow at hook boundary | Normalizes TV data in queryFn, not API route — keeps API routes returning raw TMDB shapes. | ✓ Good — clean separation |
| Sidebar hover-expand (no click/pin) | Simpler UX — expand on hover, collapse on leave. Mobile uses bottom tab bar. | ✓ Good — feels natural |
| Full-page detail routes over modal | Stremio-inspired `/movie/[id]` and `/tv/[id]` SSR pages replace in-page modal for richer content. | ✓ Good — better SEO, shareable URLs |
| Gemini 2.5 Flash Lite over 2.5 Flash | Higher free-tier quota (1000 RPD) for hobby project. | ✓ Good — resolved quota errors |
| Static mock chat for AI preview on landing | No auth required for landing page, demonstrates mood-to-genre flow visually. | ✓ Good — converts without complexity |
| Cinematic parallax hero with TMDB backdrop | Real movie imagery creates emotional connection. useScroll + useTransform for smooth parallax. | ✓ Good — visually compelling |

---
*Last updated: 2026-02-28 after v0.3 Content Expansion milestone shipped*
