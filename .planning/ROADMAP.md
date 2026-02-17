# Roadmap: Moodflix

## Overview

This milestone transforms Moodflix from a functional prototype into a polished, production-ready product. Phase 1 fixes critical watchlist reactivity bugs that break the instant-feedback promise of the core value. Phase 2 establishes brand identity with professional web assets. Phase 3 ensures quality across responsiveness, accessibility, and build integrity before final deployment.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Watchlist Reactivity** - Fix optimistic updates so all watchlist mutations reflect instantly
- [ ] **Phase 2: Branding & Assets** - Create logo, favicon, and OG images for professional web presence
- [ ] **Phase 3: Polish & QA** - Page transitions, responsive testing, accessibility audit, build validation

## Phase Details

### Phase 1: Watchlist Reactivity
**Goal**: All watchlist mutations update UI instantly across all components without page refresh. Route rename /watchlist to /library. Dual icon system. One-tap "Mark as Watched".
**Depends on**: Nothing (first phase)
**Requirements**: WATCH-R01, WATCH-R02, WATCH-R03, WATCH-R04
**Success Criteria** (what must be TRUE):
  1. User adds a movie to watchlist and sees bookmark icon update immediately on the card
  2. User marks a movie as "watched" with one tap from card or modal
  3. User sees distinct icons — bookmark for "want to watch", eye/check for "watched"
  4. User changes like/dislike rating and sees the new state immediately without refresh
  5. All changes propagate to watchlist page, movie cards, and detail modal simultaneously
**Plans:** 3 plans (sequential)

Plans:
- [x] 01-01-PLAN.md — Data layer (schema migration, server actions, hook optimistic updates)
- [x] 01-02-PLAN.md — Route rename & dual icon system (movie card + detail modal)
- [x] 01-03-PLAN.md — Library page labels & animation polish

### Phase 2: Branding & Assets
**Goal**: Professional branded web assets for social sharing and browser UI
**Depends on**: Phase 1
**Requirements**: BRAND-01, BRAND-02, BRAND-03
**Success Criteria** (what must be TRUE):
  1. Moodflix logo appears in navbar and landing page with film-strip-inspired design in crimson
  2. Browser tab shows branded favicon at all sizes (16x16, 32x32, apple-touch-icon)
  3. Social shares on Twitter/LinkedIn/Slack display custom OG image with Moodflix branding
**Plans**: TBD

Plans:
- [ ] TBD

### Phase 3: Polish & QA
**Goal**: Production-ready quality across all devices and accessibility standards
**Depends on**: Phase 2
**Requirements**: POLSH-01, POLSH-02, POLSH-03, POLSH-04
**Success Criteria** (what must be TRUE):
  1. User navigates between routes and sees smooth Framer Motion page transitions
  2. User accesses app from mobile (375px), tablet (768px), desktop (1280px+) and all layouts work correctly
  3. User navigates via keyboard only and can reach all interactive elements with visible focus states
  4. Screen reader announces all interactive elements correctly and contrast meets WCAG 2.1 AA
  5. Build completes with zero TypeScript errors and lint passes with zero warnings
**Plans**: TBD

Plans:
- [ ] TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Watchlist Reactivity | 3/3 | Complete | 2026-02-18 |
| 2. Branding & Assets | 0/TBD | Not started | - |
| 3. Polish & QA | 0/TBD | Not started | - |
