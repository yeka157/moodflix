# Phase 3: Polish & QA - Research

**Researched:** 2026-02-19
**Domain:** Page transitions, responsive layout audit, WCAG accessibility, build quality gate
**Confidence:** HIGH (core stack verified), MEDIUM (page transition approach has tradeoffs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Page Transitions
- All app routes get transitions — everything inside `/(app)`: home, discover, library, recommendations
- Auth pages (login, signup) are excluded — they already have their own entrance animations
- Transition style: Claude's discretion (pick what fits the existing Framer Motion usage in the codebase)
- Duration: Claude's discretion (optimize for snappy feel without sacrificing smoothness)
- Navbar active link indicator animates between nav items on route change (slide/fade between active states)
- Loading state: **both** — thin progress bar at top of page (like GitHub/YouTube) for fast loads + existing `loading.tsx` skeletons for slow SSR loads
- `prefers-reduced-motion`: respected — users with OS motion sensitivity get instant transitions (no animation)
- Hero banner on `/home` gets its own entrance animation (separate from the page transition itself — cinematic reveal after page settles)
- Modal transitions: Claude's discretion (evaluate current Radix behavior and upgrade if it improves the experience)

#### Responsive Layout
- Full audit needed — no specific known broken components, but check systematically
- Priority components: movie cards + grid layout, navbar, movie detail modal, hero banner
- Movie grid column count: Claude's discretion based on what looks best at each breakpoint
- Movie detail modal on mobile: Claude's discretion (evaluate full-screen sheet vs centered dialog)
- Breakpoints to test: 375px (mobile), 768px (tablet), 1280px+ (desktop)
- All interactive elements must maintain 44×44px minimum touch targets on mobile

#### Accessibility
- No skip-to-content link (not a priority for this app)
- Modal keyboard behavior: Claude's discretion (handle focus trap and keyboard nav appropriately)
- ARIA labels on icon-only buttons: Claude's discretion (scope based on codebase audit)
- Contrast fixes target three areas:
  1. Muted text (`text-muted-foreground`) on dark `#0a0a0a` backgrounds — verify 4.5:1 ratio
  2. Crimson accent (`#FB2C36`) on dark backgrounds — buttons and links
  3. Overlay text on movie poster/backdrop images (hero, movie cards)
- WCAG 2.1 AA minimum standard throughout

#### Build Quality Gate
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

## Summary

This phase has four independent work streams: page transitions, responsive layout audit, accessibility fixes, and build quality gate. All four depend on the existing codebase — this is pure polish work with no new features.

**Page transitions** in Next.js App Router with Framer Motion have a known ecosystem challenge: `AnimatePresence` exit animations don't work reliably because the App Router's context updates disrupt Framer Motion's unmount detection. The stable, production-proven approach is entry-only animations via `app/(app)/template.tsx` — the file remounts on every navigation, making entrance animations reliable without relying on exit timing. This matches the existing Framer Motion patterns already in the codebase. The top-of-page progress bar uses `nextjs-toploader` (v3.9.17, confirmed Next.js 16 + React 19 compatible via broad peer dep range). The navbar active indicator uses Framer Motion's `layoutId` shared layout animation — the standard industry pattern for sliding tab indicators.

**Contrast research** shows the crimson primary color (`#FB2C36`) achieves approximately 5.3:1 contrast ratio against the dark background — passing WCAG AA for normal text (4.5:1 required). Muted foreground text achieves approximately 7.15:1 — comfortably passing AA. The main risk area is text overlaid directly on unenhanced movie backdrop images, where contrast is unpredictable without a dark gradient overlay.

**Lint warnings** are already documented: 4 warnings exist (`_error` unused in error.tsx files, `showTagline` unused in moodflix-logo.tsx). These are all straightforward fixes (rename with `_` prefix already done for `_error`, remove unused prop from logo).

**Primary recommendation:** Use `template.tsx` for entry-only page transitions (opacity + subtle Y lift), `nextjs-toploader` for the crimson progress bar, `layoutId` for the navbar indicator, and fix the 4 existing lint warnings first before any new work.

---

## Standard Stack

### Core (already installed — no new npm installs needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | 12.33.0 | Page transitions, navbar indicator, hero animation | Already in codebase, `useReducedMotion` built-in |
| next | 16.1.6 | `template.tsx` for transition mount point | App Router file convention |
| tailwindcss | v4 | Responsive breakpoints, `motion-safe:` / `motion-reduce:` variants | Already in codebase |

### Supporting (new install required)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nextjs-toploader | 3.9.17 | Crimson top progress bar | Fast client navigations where loading.tsx hasn't triggered yet |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| nextjs-toploader | @bprogress/next | bprogress is the maintained successor to next-nprogress-bar. Either works — nextjs-toploader is simpler API for this use case |
| nextjs-toploader | Custom Framer Motion hook | The BuildUI custom approach (useSpring + context) is more composable but requires wrapping every Link with a custom component — too invasive for existing codebase |
| template.tsx entry-only | FrozenRouter + AnimatePresence exit | Exit animations require importing `next/dist/shared/lib/app-router-context.shared-runtime` (internal, unstable API). Not worth the fragility risk. |
| template.tsx (per-route) | layout.tsx wrapper | layout.tsx persists across navigations and does NOT remount — it cannot drive per-route animations |
| CSS View Transitions API | Framer Motion | `experimental.viewTransition` in Next.js 16 is explicitly marked "not recommended for production" |

**Installation:**
```bash
npm install nextjs-toploader
```

---

## Architecture Patterns

### Recommended File Structure for Phase 3
```
app/
├── (app)/
│   ├── template.tsx        # NEW: entry animation wrapper for all (app) routes
│   ├── layout.tsx          # MODIFY: add NextTopLoader here (root of (app))
│   └── ...routes
components/
├── layout/
│   └── app-navbar.tsx      # MODIFY: add layoutId active indicator
lib/
└── (no new files needed)
```

### Pattern 1: Entry-Only Page Transitions via template.tsx

**What:** `template.tsx` in Next.js App Router remounts on every navigation (unlike `layout.tsx` which persists). Place it at `app/(app)/template.tsx` to scope transitions to app routes only, excluding auth pages.

**When to use:** All `/(app)` routes — home, discover, library, recommendations

**Why entry-only (no exit):** Exit animations via `AnimatePresence` require Framer Motion to detect component unmount. The App Router's internal context updates fire before unmount, causing the exit animation to be skipped or flash. Entry-only via `initial` / `animate` (no `exit`) is fully reliable and confirmed working in Next.js 16.0.7+ (source: imcorfitz.com, multiple Next.js discussions).

**Recommended style:** Subtle fade + upward lift (`opacity: 0→1`, `y: 8→0`). Matches the existing hero banner animation (`y: 30→0, duration: 0.6`) and MovieGrid item animations (`y: 20→0, duration: 0.4`). Duration 0.25s is fast enough to feel snappy without visual delay.

```typescript
// Source: Next.js App Router template.tsx pattern (community-verified)
// app/(app)/template.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export default function AppTemplate({ children }: { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

**`prefers-reduced-motion`:** Set `initial={false}` when `shouldReduceMotion` is true — Framer Motion then skips the animation entirely and renders at final state.

### Pattern 2: Top Progress Bar (nextjs-toploader)

**What:** A thin bar at the top of the viewport that appears on navigation start and completes when the page renders. Covers fast navigations where `loading.tsx` Suspense boundary hasn't triggered yet.

**Setup location:** `app/(app)/layout.tsx` — place before `{children}` inside the layout body. This scopes it to app routes only (not auth pages).

```typescript
// Source: nextjs-toploader GitHub README (TheSGJ/nextjs-toploader)
import NextTopLoader from "nextjs-toploader";

// Inside layout return:
<>
  <NextTopLoader
    color="#FB2C36"
    showSpinner={false}
    height={2}
    shadow={false}
  />
  <AppNavbar user={{ email: user.email ?? "" }} />
  <main className="pt-16">
    {/* ... */}
  </main>
</>
```

**Props rationale:**
- `color="#FB2C36"` — matches brand crimson (matches `--primary` in OKLCH which equals `#FB2C36` hex)
- `showSpinner={false}` — Moodflix uses skeleton loading states, not spinners; the NProgress spinner in the corner would conflict
- `height={2}` — thin bar (2px); YouTube uses ~3px, GitHub uses ~2px
- `shadow={false}` — the default crimson glow shadow can clash with dark backgrounds

### Pattern 3: Navbar Active Indicator via layoutId

**What:** A background pill that slides between nav items as routes change, using Framer Motion's shared layout animation. The `layoutId` prop makes Framer Motion track one element across positions and animate between them.

**Source:** BuildUI Animated Tabs recipe (confirmed pattern for this exact use case)

**Current state:** The `app-navbar.tsx` currently uses `cn()` class switching for active state — applies `bg-primary/10` to the active button. The `layoutId` upgrade replaces this color-class approach with a physical element that moves.

```typescript
// Source: BuildUI animated-tabs recipe, adapted for app-navbar.tsx
// Inside the navLinks.map() in app-navbar.tsx:
<Link key={link.href} href={link.href}>
  <Button
    variant="ghost"
    className={cn(
      "relative gap-2 min-h-[44px] min-w-[44px]",
      active
        ? "text-primary hover:text-primary"
        : "text-muted-foreground hover:text-foreground",
    )}
  >
    {active && (
      <motion.span
        layoutId="nav-active-pill"
        className="absolute inset-0 rounded-md bg-primary/10"
        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
      />
    )}
    <Icon className="size-5 shrink-0 relative z-10" />
    <span className="hidden md:inline relative z-10">{link.label}</span>
  </Button>
</Link>
```

**Note:** The `motion.span` must be inside the `Button` but positioned `absolute inset-0` so it fills the button shape. The nav links and icon/text content need `relative z-10` to appear above the pill.

**`prefers-reduced-motion` for layoutId:** Wrap the pill in a check — if `useReducedMotion()` is true, skip the `layoutId` prop (or render it without the layout animation). The simplest approach: check `prefersReducedMotion` and pass `layoutId={shouldReduceMotion ? undefined : "nav-active-pill"}`.

### Pattern 4: Hero Entrance Animation (Upgrade Existing)

**Current state:** `hero-banner.tsx` already has:
```typescript
initial={{ opacity: 0, y: 30 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6, delay: 0.2 }}
```

**Enhancement for "cinematic" feel:** Add a staggered reveal — backdrop image fades in first, then content slides up. Use `motion.div` for each content group with increasing delays. The backdrop image itself gets a scale-in from 1.05→1 to add cinematic zoom.

```typescript
// Upgraded hero-banner.tsx pattern
// Backdrop: scale from 1.05→1 with opacity 0→1 (600ms)
// Content area: y from 40→0 with opacity 0→1 (500ms, delay 300ms)
// Each content item: stagger by 80ms
const heroVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 }
};
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } }
};
```

### Pattern 5: Modal Keyboard Accessibility (Radix Dialog — already handled)

**Current state:** `movie-detail-modal.tsx` uses Radix `Dialog` which ships with built-in focus trap and keyboard navigation (Esc to close). This is confirmed correct by official Radix docs — no changes needed to the focus trap mechanism itself.

**What to audit:** Ensure the custom `X` close button has `aria-label`, all icon-only buttons have `aria-label` (confirmed: Like/Dislike buttons in modal already have `aria-label="Like"` and `aria-label="Dislike"`), and `DialogTitle` is present (confirmed: `<DialogTitle className="sr-only">{movie?.title}</DialogTitle>` already exists).

**Modal entrance animation:** Radix Dialog already provides enter/exit CSS animations via `data-[state=open]` and `data-[state=closed]` attributes. The current shadcn/ui implementation uses CSS keyframes for open/close. This is sufficient — no Framer Motion overlay needed for the modal itself.

**Mobile modal:** The current `max-w-[calc(100%-1rem)] sm:max-w-[90vw] md:max-w-2xl` constraint already handles mobile sizing. The `max-h-[90dvh]` overflow scroll works. Recommend keeping centered dialog (not full-screen Sheet) — the content density (backdrop, cast, providers) benefits from the modal constraint framing.

### Anti-Patterns to Avoid

- **`AnimatePresence` with exit animations in App Router:** Fragile. The router context updates before component unmount, breaking exit timing. Use entry-only animations via template.tsx.
- **Importing `LayoutRouterContext` from `next/dist/`:** This is an internal, undocumented API. Although it works in Next.js 16.0.7, it can break on patch updates without warning.
- **Using `layout.tsx` for per-page animations:** The layout component persists across navigations — it will not re-animate on route change. Only `template.tsx` remounts.
- **CSS View Transitions API:** Marked as `experimental` in Next.js 16 docs, explicitly "not recommended for production."
- **Placing NextTopLoader in root `app/layout.tsx`:** This would show the bar on auth pages too. Scope it to `app/(app)/layout.tsx`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Top progress bar | Custom NProgress wiring | nextjs-toploader | App Router doesn't expose router events; hand-rolling requires monkey-patching Link or using internal Next.js APIs |
| WCAG contrast calculation | Manual color math | Browser DevTools accessibility panel or Lighthouse | Lighthouse surfaces exact failing elements with contrast ratios in the report |
| Accessibility audit | Manual code review | Lighthouse 'Accessibility' tab + browser DevTools | Lighthouse automated checks catch ~57% of WCAG issues including missing labels, contrast failures, ARIA errors |
| Focus trap in modal | Custom focus management code | Radix Dialog (already implemented) | Radix Dialog ships with WAI-ARIA-compliant focus trap built-in; override would break keyboard behavior |

**Key insight:** The codebase already implements most accessibility primitives correctly via Radix UI (focus trap, ARIA roles, keyboard nav). This phase is about catching gaps the automated tools surface, not rebuilding from scratch.

---

## Common Pitfalls

### Pitfall 1: template.tsx vs layout.tsx Confusion
**What goes wrong:** Developer adds animation to `layout.tsx` expecting it to fire on every navigation. It doesn't — layout persists.
**Why it happens:** The naming suggests layout = page structure, template = template. But the re-mount behavior is opposite to what many expect.
**How to avoid:** Only use `template.tsx` for animations. Verify the animation fires on every nav by checking the network tab — if the Server Component data refetches, `template.tsx` re-rendered.
**Warning signs:** Animation only plays on first load, not subsequent navigations.

### Pitfall 2: layoutId Across Page Boundaries
**What goes wrong:** Using the same `layoutId` value in a component that exists in both the old and new page during navigation causes a jarring jump because Framer Motion tries to animate the shared element across DOM positions.
**Why it happens:** `layoutId` with AnimatePresence works across tree positions, but in the App Router without a stable parent, the effect misfires.
**How to avoid:** Keep `layoutId` values scoped within `layout.tsx` components that persist across routes (like the navbar). Never use the same `layoutId` in a `template.tsx` component.
**Warning signs:** An element jumps to the top-left corner or flashes during navigation.

### Pitfall 3: nextjs-toploader `showSpinner` Default
**What goes wrong:** The default `showSpinner={true}` renders a small spinning NProgress indicator in the top-right corner of the viewport. This conflicts with the dark theme and Moodflix's skeleton-based loading UX.
**Why it happens:** NProgress historically bundled the spinner; nextjs-toploader enables it by default.
**How to avoid:** Always set `showSpinner={false}`.
**Warning signs:** Small circular spinner appears in the viewport corner during navigation.

### Pitfall 4: Contrast Check on Overlay Text
**What goes wrong:** Text overlaid on movie poster/backdrop images fails contrast checks because the underlying image is unpredictable — some backdrops are light, some dark.
**Why it happens:** Image-based backgrounds cannot have a guaranteed contrast ratio.
**How to avoid:** Always pair text-over-image with a dark gradient overlay. The hero banner already does this (`bg-gradient-to-t from-background via-background/60 to-transparent`). Movie cards use `bg-linear-to-t from-black/90 via-black/40 to-transparent`. Verify these gradient coverages in Lighthouse.
**Warning signs:** Lighthouse accessibility score flags "Contrast ratio" failures specifically on image-overlaid text.

### Pitfall 5: Lint Warning Misidentification — `_error` prefix
**What goes wrong:** The `_error` parameter (prefixed with `_` to signal intentional non-use) is still flagged by ESLint because the rule checks the entire identifier name pattern.
**Why it happens:** The `_error` warnings exist because the variable name still doesn't match the expected pattern in the configured ESLint rule. The error.tsx convention requires the parameter to receive `error` for type matching but the linter still flags it.
**How to avoid:** Fix the actual ESLint warning — the correct approach is to destructure only the fields actually used (e.g., only use `reset`, declare `error` as `_error` or use the `no-unused-vars` ignore comment). Check which ESLint rule is triggering and apply the correct suppression.
**Warning signs:** `npm run lint` shows warnings for `error.tsx` files.

### Pitfall 6: Reduced Motion Breaking layoutId
**What goes wrong:** When `prefers-reduced-motion` is set, passing `layoutId` still causes a brief layout animation to play because `useReducedMotion()` doesn't automatically disable layout animations.
**Why it happens:** `useReducedMotion` controls `animate` / `initial` variants but layout animations (`layoutId`) have a separate animation path in Framer Motion.
**How to avoid:** Conditionally omit the `layoutId` prop when `prefersReducedMotion` is true, or use `transition={{ duration: 0 }}` for instant snapping.
**Warning signs:** Users with OS motion sensitivity setting still see the pill sliding.

---

## Code Examples

Verified patterns from research:

### Page Transition — template.tsx (entry-only, stable)
```typescript
// Source: Community-verified Next.js App Router pattern, confirmed Next.js 16.0.7
// app/(app)/template.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export default function AppTemplate({ children }: { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

### Progress Bar Setup
```typescript
// Source: nextjs-toploader README (TheSGJ/nextjs-toploader v3.9.17)
// app/(app)/layout.tsx — inside the layout body
import NextTopLoader from "nextjs-toploader";

// Add before AppNavbar:
<NextTopLoader
  color="#FB2C36"
  showSpinner={false}
  height={2}
  shadow={false}
/>
```

### Navbar Active Pill via layoutId
```typescript
// Source: BuildUI animated-tabs recipe (buildui.com/recipes/animated-tabs)
// components/layout/app-navbar.tsx — inside the navLinks.map()
{active && (
  <motion.span
    layoutId={shouldReduceMotion ? undefined : "nav-active-pill"}
    className="absolute inset-0 rounded-md bg-primary/10"
    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
  />
)}
```

### Hero Entrance — Staggered Cinematic Reveal
```typescript
// Source: Framer Motion staggerChildren pattern (motion.dev docs)
// components/movies/hero-banner.tsx — upgrade to stagger
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};
// Backdrop gets its own: initial={{ opacity: 0, scale: 1.05 }} → animate={{ opacity: 1, scale: 1 }}
// Use motion.div with variants="containerVariants" on content wrapper
// Each text/badge group gets variants="itemVariants"
```

### Lint Fix — error.tsx unused param
```typescript
// Fix: destructure only used params, type the error param correctly
export default function DiscoverError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) { ... }
// OR keep the error: _error pattern with explicit ESLint disable if needed
```

### Lint Fix — moodflix-logo.tsx unused prop
```typescript
// Fix: remove showTagline from interface and function signature
// It is passed as showTagline={false} (default) in app-navbar.tsx — the prop is dead code
interface MoodflixLogoProps {
  height?: number;
  variant?: "dark" | "light";
  // remove showTagline
  className?: string;
}
```

---

## Contrast Analysis

Research finding (computed with WCAG relative luminance formula from actual sRGB values):

| Color Pair | Computed Ratio | WCAG AA (4.5:1) | WCAG AA Large (3:1) | Status |
|-----------|----------------|-----------------|---------------------|--------|
| Muted text (`oklch(0.65 0.01 25)` ≈ `#a09898`) on dark bg (`oklch(0.13 0.004 25)` ≈ `#100404`) | ~7.15:1 | PASS | PASS | Good |
| Crimson primary (`#FB2C36`) on dark bg | ~5.30:1 | PASS | PASS | Good |
| White text on gradient-covered backdrop (30% opacity overlay) | ~8.45:1 | PASS | PASS | Good |

**Note:** These are approximations. Exact OKLCH-to-sRGB conversion requires a color profile calculation. The estimates indicate the contrast is likely adequate, but Lighthouse will produce the authoritative measurement against the rendered DOM. Run Lighthouse after Phase 3 work is complete to confirm.

**Risk area:** The hero backdrop image has a gradient going from full `background` at the bottom to `transparent` at the top. Text at the very top of the hero content block (if any) may be over a lighter portion. Currently the hero text is only at the bottom (`absolute bottom-0`) so this is not an issue.

**Movie card overlay text risk:** The hover overlay uses `bg-linear-to-t from-black/90 via-black/40 to-transparent`. Text appears only in the bottom area (from-black/90 zone), so contrast is maintained. The star rating and badges in the overlay are white on black/90, which exceeds 7:1.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NProgress (nprogress-v2) | @bprogress/next OR nextjs-toploader | 2024-2025 | nprogress v2 became BProgress; nextjs-toploader remains stable and actively maintained |
| AnimatePresence in layout.tsx | template.tsx entry-only | Next.js 13 App Router | Exit animations in App Router are fundamentally broken; entry-only is the stable pattern |
| CSS View Transitions (experimental) | Still experimental in Next.js 16 | 2025 | Explicitly "not recommended for production" in Next.js 16.1.6 docs |
| HSL color values in shadcn/ui | OKLCH color values | shadcn/ui v2+ / Tailwind v4 | WCAG contrast checking tools may need OKLCH-aware versions (OddContrast handles this) |

**Deprecated/outdated:**
- `next-nprogress-bar`: No longer maintained — migrated to `@bprogress/next`. Do not install `next-nprogress-bar` for new projects.
- `experimental.viewTransition` in Next.js: Do not use in production (Next.js docs say "not recommended for production" as of Next.js 16.1.6).
- `LayoutRouterContext` import from `next/dist/shared/lib/app-router-context.shared-runtime`: Internal API, avoid in production.

---

## Existing Codebase Findings

### Current Lint Warnings (4 total — all must be fixed)
1. `app/(app)/discover/error.tsx:7` — `'_error' is defined but never used` (same pattern for home and library error.tsx)
2. `app/(app)/home/error.tsx:7` — `'_error' is defined but never used`
3. `app/(app)/library/error.tsx:7` — `'_error' is defined but never used`
4. `components/brand/moodflix-logo.tsx:14` — `'showTagline' is assigned a value but never used`

**Fix strategy:**
- error.tsx files: Remove `error: _error` from the destructured params (just keep `reset`). The type annotation can remain on the outer interface.
- moodflix-logo.tsx: Remove `showTagline` from the interface and function signature entirely — it's a dead prop.

### Current Animation Patterns in Codebase
The codebase uses these Framer Motion patterns — new transitions should match this style:

| Component | Animation | Duration | Delay |
|-----------|-----------|----------|-------|
| hero-banner.tsx | `y: 30→0, opacity 0→1` | 600ms | 200ms |
| movie-card.tsx | `whileHover scale: 1.05` | spring (stiffness 300) | — |
| movie-grid.tsx | `whileInView y: 20→0` | 400ms | — |
| mood-section.tsx | `AnimatePresence opacity+y 10→0` | default | — |
| movie-card.tsx | `whileTap scale: 0.85` | spring | — |

**Recommendation:** Page transition at `y: 8, duration: 0.25s` is appropriately subtler than the hero (y:30, 600ms) — it should feel invisible except as a micro-polish.

### Pre-existing Accessibility
- Icon-only buttons with `aria-label`: Confirmed on movie-card.tsx (Bookmark, CircleCheck), movie-detail-modal.tsx (Like, Dislike)
- `DialogTitle` with `sr-only`: Already in movie-detail-modal.tsx
- Touch targets 44px: Already enforced via `min-h-[44px] min-w-[44px]` on nav buttons and `h-8 w-8` (32px, needs check) on movie card action buttons
- `useReducedMotion`: Already imported and used in movie-card.tsx and movie-detail-modal.tsx

**Touch target gap found:** Movie card action buttons (Bookmark, CircleCheck) are `h-8 w-8` = 32px. These are below the 44px minimum touch target. They're inside a hover overlay on desktop, but on touch devices they're always visible. This needs to be fixed.

---

## Open Questions

1. **Movie card action buttons touch target size**
   - What we know: Current size is `h-8 w-8` (32px) — below 44px minimum
   - What's unclear: On mobile, these buttons are always visible (not hidden behind hover). They're the primary interaction surface for adding to library.
   - Recommendation: Increase to `h-11 w-11` (44px) on mobile via `[@media(hover:none)]:h-11 [@media(hover:none)]:w-11` Tailwind variant. Icons remain `h-4 w-4` inside.

2. **Lighthouse 90+ on Performance — Framer Motion bundle size**
   - What we know: Framer Motion 12 ships ~34KB minified. The codebase already uses it heavily, so it's already in the bundle. LazyMotion with `domAnimation` can reduce the initial hit to ~6KB but requires replacing all `motion.*` components with `m.*` throughout the codebase — substantial refactor.
   - What's unclear: Whether the current bundle passes Lighthouse 90+ without optimization.
   - Recommendation: Do NOT refactor to LazyMotion in this phase — it's high effort, potentially introduces bugs, and the codebase has extensive existing Framer Motion usage. Instead, run Lighthouse first and only optimize if Performance is below 90.

3. **Navbar active indicator — hydration flash**
   - What we know: `usePathname()` is used client-side; the server renders the navbar without knowing the active route initially. The `layoutId` animation fires when the active pill mounts.
   - What's unclear: Whether there's a visible flash between server render (no active state) and client render (active state with pill).
   - Recommendation: The current navbar already uses `cn()` to apply `bg-primary/10` conditionally — any hydration flash is already present and this approach doesn't make it worse. The `layoutId` pill approach maintains the same behavior.

---

## Sources

### Primary (HIGH confidence)
- Next.js docs: `next.config.js/viewTransition` — confirmed experimental, not for production (Next.js 16.1.6, 2026-02-16)
- nextjs-toploader GitHub (TheSGJ/nextjs-toploader) — v3.9.17, peer deps `next >= 6.0.0, react >= 16.0.0`
- Radix UI Animation guide (radix-ui.com/primitives/docs/guides/animation) — forceMount pattern for Framer Motion
- BuildUI animated-tabs recipe (buildui.com/recipes/animated-tabs) — layoutId bubble pattern

### Secondary (MEDIUM confidence)
- imcorfitz.com: Framer Motion page transitions in Next.js App Router — FrozenRouter approach, confirmed Next.js 16.0.7
- Next.js GitHub Discussion #42658: App Router AnimatePresence limitations confirmed by community (2+ year thread)
- Contrast ratios computed with WCAG relative luminance formula from approximate sRGB values for OKLCH colors

### Tertiary (LOW confidence)
- Lighthouse 90+ achievability without Framer Motion optimization — needs empirical validation by running Lighthouse on the actual app

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — nextjs-toploader is confirmed compatible, Framer Motion already installed, template.tsx is official Next.js convention
- Architecture: HIGH for entry-only transitions, MEDIUM for layoutId nav indicator (hydration behavior untested in this specific codebase)
- Pitfalls: HIGH — most are observed ecosystem-wide issues, not theoretical
- Contrast ratios: MEDIUM — computed approximations, Lighthouse will give exact values

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (30 days; stable stack)
