# Moodflix

## What This Is

A movie watchlist and recommendation app with AI-powered mood-based discovery. Users browse movies via TMDB, manage a personal watchlist with status tracking and ratings, and get AI-generated genre recommendations based on their current mood. Built with Next.js 16, Supabase, and Google Gemini. Deployed on Vercel.

## Core Value

Users can discover movies that match their mood and manage what they've watched — the watchlist experience must feel instant and intuitive.

## Requirements

### Validated

- ✓ Landing page with feature showcase and AI preview — Phase 1
- ✓ Email/password and Google OAuth authentication — Phase 3
- ✓ Protected app routes with session management — Phase 3
- ✓ Home page with hero banner, trending movies, and feature cards — Phase 4
- ✓ Movie discovery with search, genre filters, and infinite scroll — Phase 5
- ✓ Movie detail modal with backdrop, cast, watch providers — Phase 5
- ✓ Regional watch provider data via country detection — Phase 5
- ✓ Watchlist CRUD with status tracking (want to watch/watching/watched) — Phase 6
- ✓ Like/dislike rating system on watchlist items — Phase 6
- ✓ AI mood-based chat with streaming responses and genre suggestions — Phase 7
- ✓ AI recommendation results page with infinite scroll — Phase 7
- ✓ Rate limiting on AI endpoints (10 req/day) — Phase 7
- ✓ Error boundaries for all app routes — Polish
- ✓ SEO, OG images, and structured data — Polish

### Active

- [ ] Fix watchlist optimistic updates not propagating across components (BACKLOG-16, 17, 19)
- [ ] Add "Mark as Watched" quick action on movie cards and detail modal (BACKLOG-15)
- [ ] Separate visual icons for "watched" vs "want to watch" on movie cards (BACKLOG-18)
- [ ] Add Framer Motion page transitions (POLISH-01)
- [ ] Responsive testing and fixes across breakpoints (POLISH-03)
- [ ] Accessibility audit — keyboard nav, screen reader, contrast (POLISH-04)
- [ ] Final build + lint validation (POLISH-05)

### Out of Scope

- Passkey/WebAuthn login — on hold, requires Supabase MFA config (BACKLOG-03)
- Auth form refactor to shadcn FormField — low priority, works fine as-is (BACKLOG-01)
- Apple Sign In — no Apple Developer Program membership
- Mobile native app — web-only
- Premium tier / payments — not for v1
- Real-time collaborative features — not needed for personal watchlist

## Context

- **Codebase state:** Phases 1-7 complete. All core features built and functional. Build and lint pass.
- **Deployment:** Live on Vercel via main branch auto-deploy.
- **Known issues:** Watchlist mutations (add, status change, like/dislike) don't reflect instantly in the UI. TanStack Query optimistic updates exist but cache invalidation isn't propagating to all consuming components (movie cards, watchlist page, detail modal).
- **UX gap:** No way to mark a movie as "watched" without first adding to watchlist then changing status. Users want a one-tap "I've seen this" action.
- **Visual gap:** Movie cards show the same bookmark icon regardless of watchlist status. No visual distinction between "want to watch" and "watched".

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
| Two action buttons instead of status dropdown | Faster UX — bookmark for "want to watch", eye/check for "watched". Eliminates extra click. | — Pending |
| Keep `watching` status in schema but remove from card UI | Rarely used; can still be set from watchlist page dropdown. Cards focus on the two primary actions. | — Pending |
| Fix optimistic updates at query key level | Root cause is likely stale query keys — fix invalidation rather than adding more polling. | — Pending |

---
*Last updated: 2026-02-17 after initialization*
