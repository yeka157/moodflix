# Phase 3: Polish & QA - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Bring the existing Moodflix app to production quality — smooth page transitions, correct layouts across device sizes (375px / 768px / 1280px+), accessible to keyboard and screen reader users, and a clean build gate (zero TypeScript errors, zero lint warnings, Lighthouse 90+). No new features. Deploy is a separate manual step after review.

</domain>

<decisions>
## Implementation Decisions

### Page Transitions
- All app routes get transitions — everything inside `/(app)`: home, discover, library, recommendations
- Auth pages (login, signup) are excluded — they already have their own entrance animations
- Transition style: Claude's discretion (pick what fits the existing Framer Motion usage in the codebase)
- Duration: Claude's discretion (optimize for snappy feel without sacrificing smoothness)
- Navbar active link indicator animates between nav items on route change (slide/fade between active states)
- Loading state: **both** — thin progress bar at top of page (like GitHub/YouTube) for fast loads + existing `loading.tsx` skeletons for slow SSR loads
- `prefers-reduced-motion`: respected — users with OS motion sensitivity get instant transitions (no animation)
- Hero banner on `/home` gets its own entrance animation (separate from the page transition itself — cinematic reveal after page settles)
- Modal transitions: Claude's discretion (evaluate current Radix behavior and upgrade if it improves the experience)

### Responsive Layout
- Full audit needed — no specific known broken components, but check systematically
- Priority components: movie cards + grid layout, navbar, movie detail modal, hero banner
- Movie grid column count: Claude's discretion based on what looks best at each breakpoint
- Movie detail modal on mobile: Claude's discretion (evaluate full-screen sheet vs centered dialog)
- Breakpoints to test: 375px (mobile), 768px (tablet), 1280px+ (desktop)
- All interactive elements must maintain 44×44px minimum touch targets on mobile

### Accessibility
- No skip-to-content link (not a priority for this app)
- Modal keyboard behavior: Claude's discretion (handle focus trap and keyboard nav appropriately)
- ARIA labels on icon-only buttons: Claude's discretion (scope based on codebase audit)
- Contrast fixes target three areas:
  1. Muted text (`text-muted-foreground`) on dark `#0a0a0a` backgrounds — verify 4.5:1 ratio
  2. Crimson accent (`#FB2C36`) on dark backgrounds — buttons and links
  3. Overlay text on movie poster/backdrop images (hero, movie cards)
- WCAG 2.1 AA minimum standard throughout

### Build Quality Gate
- **Lint:** Zero warnings total — fix all pre-existing warnings in addition to anything new
- **TypeScript:** Zero errors (already passing, maintain this)
- **Lighthouse:** Target 90+ on Performance, Accessibility, and Best Practices
- **Done criteria** (Claude-determined from ROADMAP success criteria):
  1. All 5 ROADMAP success criteria pass
  2. Zero TS errors, zero lint warnings
  3. Lighthouse 90+ on Performance, Accessibility, Best Practices
  4. Visual check confirmed at 375px, 768px, 1280px
  5. Build completes cleanly (`npm run build`)
- Deploy: NOT part of this phase — manual decision after review

### Claude's Discretion
- Page transition style and duration (fit the existing Framer Motion codebase patterns)
- Movie grid column count at each breakpoint
- Modal full-screen vs centered on mobile
- Modal keyboard/focus trap implementation
- ARIA label scope (audit-driven)

</decisions>

<specifics>
## Specific Ideas

- Progress bar at top should be crimson (`#FB2C36`) to match the brand — like NProgress but styled to the Moodflix accent
- Hero entrance animation on `/home` should feel cinematic — the hero is the most visually prominent component, deserves special attention
- Navbar active state animation should feel fluid, not jumpy — the active indicator sliding between items as the user navigates

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-polish-qa*
*Context gathered: 2026-02-19*
