# Requirements: Moodflix

**Defined:** 2026-02-17
**Core Value:** Users can discover movies that match their mood and manage what they've watched — the watchlist experience must feel instant and intuitive.

## v1 Requirements

Requirements for this milestone (polish, bug fixes, branding). Each maps to roadmap phases.

### Watchlist Reactivity

- [ ] **WATCH-R01**: All watchlist mutations (add, remove, status change, rating) update UI instantly across all consuming components without page refresh
- [ ] **WATCH-R02**: User can mark a movie as "watched" with one tap from movie card and detail modal
- [ ] **WATCH-R03**: Movie cards show distinct icons — bookmark for "want to watch", eye/check for "watched"
- [ ] **WATCH-R04**: Like/dislike rating changes reflect immediately in the UI

### Branding & Assets

- [ ] **BRAND-01**: Moodflix logo inspired by Movielist film-strip reference, crimson on dark
- [ ] **BRAND-02**: Favicon set generated from logo (16x16, 32x32, apple-touch-icon, etc.)
- [ ] **BRAND-03**: OG images for social sharing with new branded design

### Polish & QA

- [ ] **POLSH-01**: Smooth Framer Motion page transitions between app routes
- [ ] **POLSH-02**: Layout tested and fixed across mobile (375px), tablet (768px), desktop (1280px+)
- [ ] **POLSH-03**: WCAG 2.1 AA accessibility audit passed — keyboard nav, contrast, screen reader
- [ ] **POLSH-04**: `npm run build` and `npm run lint` pass with zero errors

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Navigation & Layout

- **NAV-01**: Sidebar navigation layout (matching Revamp-UI reference)
- **NAV-02**: Collapsible sidebar on mobile

### Future Features (from sidebar reference)

- **FUTURE-01**: TV Shows section
- **FUTURE-02**: "My Top 100" personal list
- **FUTURE-03**: Premium/Upgrade tier with higher AI rate limits

### Authentication

- **AUTH-V2-01**: Passkey/WebAuthn login
- **AUTH-V2-02**: Auth form refactor to shadcn FormField

## Out of Scope

| Feature | Reason |
|---------|--------|
| Sidebar navigation | Deferred to v2 — current top navbar works fine, layout change is high risk for a polish milestone |
| Apple Sign In | No Apple Developer Program membership |
| Mobile native app | Web-only for now |
| Real-time cross-tab sync | Overkill for personal app — TanStack Query `refetchOnWindowFocus` is sufficient |
| Drag-to-reorder watchlist | Requires schema change + complex DnD, low value for now |
| Social features | Not in scope until product-market fit established |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| WATCH-R01 | Phase 1 | Pending |
| WATCH-R02 | Phase 1 | Pending |
| WATCH-R03 | Phase 1 | Pending |
| WATCH-R04 | Phase 1 | Pending |
| BRAND-01 | Phase 2 | Pending |
| BRAND-02 | Phase 2 | Pending |
| BRAND-03 | Phase 2 | Pending |
| POLSH-01 | Phase 3 | Pending |
| POLSH-02 | Phase 3 | Pending |
| POLSH-03 | Phase 3 | Pending |
| POLSH-04 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-17*
*Last updated: 2026-02-17 after initial definition*
