# Stack Research

**Domain:** Movie watchlist polish & bug fixes
**Researched:** 2026-02-17
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

Already installed — no new core technologies needed for this milestone.

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TanStack Query | 5.90.20 | Cache invalidation fixes | Already in use; fix patterns, not library |
| Framer Motion | 12.33.0 | Page transitions | Already installed; use `AnimatePresence` + `layoutId` |
| Next.js | 16.1.6 | App Router transitions | `usePathname()` for route-aware animations |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `axe-core` | ^4.10 | Automated a11y testing | During POLISH-04 accessibility audit |
| `@axe-core/react` | ^4.10 | React-specific a11y checks | Development-only; wrap app in dev mode |
| `eslint-plugin-jsx-a11y` | ^6.10 | Static a11y linting | Add to ESLint config for CI |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Chrome DevTools Lighthouse | Accessibility audit | Built-in, no install needed |
| axe DevTools extension | Interactive a11y testing | Free browser extension |
| OKLCH Color Contrast Checker | Verify crimson accent meets AA | Use oklch.com or Polypane contrast tool |

## Installation

```bash
# Accessibility testing (dev only)
npm install -D @axe-core/react eslint-plugin-jsx-a11y
```

No new runtime dependencies needed. All fixes use existing libraries.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| axe-core | Pa11y | Pa11y is better for CI pipelines; axe-core better for component-level testing |
| Framer Motion `AnimatePresence` | View Transitions API | View Transitions API is simpler but has limited browser support and doesn't work well with React 19 streaming |
| TanStack Query optimistic updates | SWR `mutate` | Only if migrating from TanStack Query (we're not) |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `next-view-transitions` | Experimental, incompatible with React 19 streaming | Framer Motion `AnimatePresence` |
| Manual `fetch` + `setState` for mutations | Loses cache consistency, the exact bug we're fixing | TanStack Query `useMutation` with proper optimistic updates |
| `react-aria` for full a11y | Massive scope creep — shadcn/ui already uses Radix which handles most a11y | eslint-plugin-jsx-a11y + manual audit |
| GSAP | Project convention is Framer Motion only | Framer Motion |

## Stack Patterns by Variant

**For optimistic updates across components:**
- Use shared query key factory (`watchlistKeys`)
- Optimistically update ALL related query keys in `onMutate`
- Use `queryClient.invalidateQueries({ queryKey: watchlistKeys.all })` in `onSettled` to refetch truth

**For page transitions:**
- Wrap page content in `motion.div` with `AnimatePresence` in layout
- Use `usePathname()` as `key` for route changes
- Keep animations under 300ms for perceived performance

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Framer Motion 12.x | React 19 | Full support, no issues |
| TanStack Query 5.x | React 19 | Full support with concurrent features |
| @axe-core/react 4.x | React 19 | Works in dev mode only |

## Sources

- TanStack Query v5 docs — optimistic updates, query invalidation
- Framer Motion docs — AnimatePresence, layout animations
- axe-core documentation — React integration
- WCAG 2.1 specification — AA compliance criteria

---
*Stack research for: movie watchlist polish & bug fixes*
*Researched: 2026-02-17*
