# Pitfalls Research

**Domain:** Movie watchlist polish & bug fixes
**Researched:** 2026-02-17
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Optimistic Update Cache Key Mismatch

**What goes wrong:**
Optimistic update modifies `watchlistKeys.list()` but the component consuming `watchlistKeys.list("want_to_watch")` doesn't see the change — different cache entries.

**Why it happens:**
TanStack Query treats `["watchlist", "list", "all"]` and `["watchlist", "list", "want_to_watch"]` as separate cache entries. Updating one doesn't update the other.

**How to avoid:**
In every `onMutate`, update ALL list variants that could be affected. For status changes, update both the old status list (remove item) and new status list (add item), plus the "all" list.

**Warning signs:**
- Watchlist page "All" tab updates but "Want to Watch" tab doesn't
- Adding to watchlist works on Discover but doesn't show on Watchlist page

**Phase to address:** Phase 1 (bug fixes)

---

### Pitfall 2: Stale `tmdbIds` Blocking Optimistic Perception

**What goes wrong:**
`useWatchlistTmdbIds` has `staleTime: 30_000`. Even after `invalidateQueries`, the hook serves cached data until staleTime expires, making the bookmark icon appear stuck.

**Why it happens:**
`staleTime` tells TanStack Query "don't refetch this even if invalidated, until this time passes." This conflicts with wanting instant updates after mutations.

**How to avoid:**
Either (a) reduce `staleTime` on tmdbIds to `0` and rely on `gcTime` for deduplication, or (b) always optimistically update the tmdbIds cache in `onMutate` so the UI never waits for refetch.

**Warning signs:**
- Bookmark icon stays outline for several seconds after clicking
- Multiple rapid adds only show the first one

**Phase to address:** Phase 1 (bug fixes)

---

### Pitfall 3: Framer Motion AnimatePresence + Server Components

**What goes wrong:**
`AnimatePresence` requires a client component wrapper. If placed wrong in the layout hierarchy, it can prevent Server Components from streaming, causing full-page waterfalls.

**Why it happens:**
`AnimatePresence` needs to wrap `children` and track `key` changes. This means the parent must be a Client Component. If the layout itself becomes a Client Component, Server Components inside lose their streaming behavior.

**How to avoid:**
Keep `app/(app)/layout.tsx` as a Server Component. Create a small `<PageTransition>` Client Component that only wraps `{children}` with `AnimatePresence`. The Server Component renders `<PageTransition>{children}</PageTransition>`.

**Warning signs:**
- Pages flash white/blank during navigation
- Loading states don't show (streaming broken)
- `"use client"` on layout.tsx

**Phase to address:** Phase 2 (page transitions)

---

### Pitfall 4: Exit Animations Breaking Navigation

**What goes wrong:**
`AnimatePresence mode="wait"` holds the old page until exit animation completes before mounting new page. If the new page has data fetching, users see old page → blank → new page.

**Why it happens:**
`mode="wait"` serializes exit and enter animations. Combined with SSR data fetching, the enter animation starts only after the new page's server component resolves.

**How to avoid:**
Use `mode="wait"` with very short durations (150-200ms). Or use `mode="popLayout"` which allows overlap. Test with slow network to verify UX.

**Warning signs:**
- Navigation feels sluggish despite fast transitions
- Brief flash of empty content between pages

**Phase to address:** Phase 2 (page transitions)

---

### Pitfall 5: OKLCH Color Contrast Failures

**What goes wrong:**
The crimson accent `oklch(0.637 0.237 25.331)` on dark background may not meet WCAG AA 4.5:1 contrast ratio for text, or 3:1 for large text/UI components.

**Why it happens:**
OKLCH is perceptually uniform but doesn't directly map to WCAG contrast ratios. A color that "looks readable" in OKLCH may fail the algorithm-based contrast check.

**How to avoid:**
Test specific combinations: crimson text on dark background, white text on crimson background, crimson borders/icons on dark. Use a contrast checker that supports OKLCH (or convert to hex first).

**Warning signs:**
- Lighthouse accessibility score below 90
- axe-core reports contrast violations on primary-colored elements

**Phase to address:** Phase 3 (accessibility audit)

---

### Pitfall 6: Missing Keyboard Handlers on Custom Buttons

**What goes wrong:**
The bookmark and "mark as watched" buttons on MovieCard use `<button>` with `onClick` but may not handle keyboard events (Enter/Space) properly when combined with `e.stopPropagation()`.

**Why it happens:**
`stopPropagation` on the button's click handler prevents the card's click from firing. But if the button doesn't properly receive keyboard focus (e.g., hidden by `opacity-0`), keyboard users can't activate it.

**How to avoid:**
Ensure buttons are focusable even when visually hidden (`opacity-0` + `focus-visible:opacity-100`). Test Tab navigation through movie grid.

**Warning signs:**
- Can't Tab to bookmark button
- Enter key on focused card doesn't open modal

**Phase to address:** Phase 3 (accessibility audit)

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `staleTime: 30_000` on tmdbIds | Fewer server calls | Stale UI after mutations | Never for mutation-heavy data; fine for read-only |
| No optimistic updates on status/rating | Simpler mutation code | Perceived latency | Never for user-facing instant actions |
| Single `number[]` return from tmdbIds | Simple query, fast | Can't differentiate status on cards | Only if all statuses use same icon |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| TanStack Query + Server Actions | Forgetting that server actions can throw, causing unhandled rejection in mutation | Always wrap server action calls in try-catch within `mutationFn`, or handle errors in `onError` |
| Framer Motion + Next.js Image | `motion.div` wrapping `<Image>` can cause layout shift during animation | Use `layout="position"` or avoid animating containers with `fill` images |
| shadcn/ui Tooltip + mobile | Tooltips don't work on touch — `hover` trigger is inaccessible | Add `aria-label` as fallback; don't rely on tooltip for critical info |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-rendering all MovieCards on any watchlist change | Sluggish grid after mutation | Use `React.memo` on MovieCard, ensure stable `onClick` ref | >50 cards visible |
| AnimatePresence re-mounting entire page tree | Slow transitions, lost scroll position | Only animate the content wrapper, not the navbar/layout | Any page with long lists |
| N+1 `useWatchlistCheck` calls per card | One query per visible card | Use single `useWatchlistTmdbIds` (map) for all cards | >20 cards visible |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Spinner on watchlist button | User thinks action is slow | Optimistic update — change icon immediately, spinner only on error |
| Same icon for all watchlist states | User can't tell watched from want-to-watch at a glance | Distinct icons: bookmark (want), eye (watched) |
| No feedback on status change | User unsure if click registered | Brief toast or icon animation confirming change |
| Exit animation blocks navigation | User feels stuck during page switch | Keep transitions under 200ms |

## "Looks Done But Isn't" Checklist

- [ ] **Optimistic updates:** Often missing rollback on error — verify `onError` restores previous state
- [ ] **Page transitions:** Often break loading.tsx skeletons — verify loading states still show during transition
- [ ] **Accessibility:** Often missing `aria-label` on icon-only buttons — verify all buttons have accessible names
- [ ] **Responsive:** Often breaks on 375px width — verify movie grid doesn't overflow on iPhone SE
- [ ] **Touch targets:** Often below 44px — verify all buttons meet minimum size on mobile
- [ ] **Color contrast:** Often fails on colored backgrounds — verify crimson accent passes AA on dark bg
- [ ] **Keyboard nav:** Often missing focus styles — verify `focus-visible` ring on all interactive elements

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Cache key mismatch | LOW | Add missing setQueryData calls to onMutate |
| Broken page transitions | LOW | Remove AnimatePresence, fallback to instant navigation |
| Contrast failures | LOW | Adjust lightness in OKLCH (increase L value) |
| Broken keyboard nav | MEDIUM | Add aria-labels, ensure focusable, test with screen reader |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Cache key mismatch | Phase 1 (bug fixes) | All watchlist mutations update UI instantly across all views |
| Stale tmdbIds | Phase 1 (bug fixes) | Bookmark icon toggles immediately on click |
| AnimatePresence + Server Components | Phase 2 (transitions) | Pages stream correctly, loading states show |
| Exit animation blocking | Phase 2 (transitions) | Navigation feels snappy (<200ms perceived) |
| OKLCH contrast | Phase 3 (accessibility) | Lighthouse accessibility ≥90, no axe violations |
| Missing keyboard handlers | Phase 3 (accessibility) | All actions reachable via Tab + Enter |

## Sources

- TanStack Query v5 — Optimistic Updates documentation
- Framer Motion — AnimatePresence gotchas
- WCAG 2.1 — Contrast ratio requirements (1.4.3, 1.4.11)
- axe-core — Common violation patterns
- Next.js App Router — Client/Server Component boundaries

---
*Pitfalls research for: movie watchlist polish & bug fixes*
*Researched: 2026-02-17*
