# Feature Research

**Domain:** Movie watchlist UX & polish
**Researched:** 2026-02-17
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Instant UI feedback on watchlist add/remove | Netflix, Letterboxd, IMDb all respond <100ms | MEDIUM | Fix optimistic updates in TanStack Query |
| Visual distinction between "watched" and "want to watch" | Letterboxd uses eye icon (watched) vs clock (want to watch) | LOW | Different icons + colors per status |
| One-tap "Mark as Watched" | Letterboxd has dedicated "watched" button on every film | MEDIUM | Add eye/check icon alongside bookmark |
| Status changes reflect immediately | Users expect instant toggle, not spinner → wait → update | MEDIUM | Add optimistic updates to status/rating mutations |
| Responsive layout across devices | Users browse movies on phones | MEDIUM | Test 375px, 768px, 1280px+ |
| Keyboard navigation for all actions | Power users and accessibility requirement | LOW | Already mostly handled by Radix/shadcn |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Smooth page transitions | Netflix-like polish; most web apps don't have this | MEDIUM | Framer Motion AnimatePresence |
| AI mood recommendations | Unique feature not in Netflix/Letterboxd | N/A | Already built |
| Regional watch providers | "Where to watch" with user's country | N/A | Already built |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time sync across tabs | "I opened two tabs and they're out of sync" | Complex WebSocket setup, overkill for personal app | TanStack Query `refetchOnWindowFocus: true` (already default) |
| Undo toast for watchlist actions | "I accidentally removed a movie" | Adds complexity to every mutation | Confirm dialog for destructive actions only |
| Drag-to-reorder watchlist | "I want to prioritize my list" | Requires sortOrder column, complex DnD | Sort by date added / rating (already implicit) |

## Feature Dependencies

```
[Fix optimistic updates] ──required by──> [Instant "Mark as Watched"]
                          ──required by──> [Separate status icons]
                          ──required by──> [Like/dislike instant feedback]

[Fix optimistic updates] ──independent of──> [Page transitions]
[Fix optimistic updates] ──independent of──> [Responsive testing]
[Page transitions] ──independent of──> [Accessibility audit]
```

### Dependency Notes

- **Optimistic updates must be fixed first:** All watchlist UX improvements depend on the cache propagation fix. Adding new buttons (BACKLOG-15) without fixing updates (BACKLOG-16/17/19) would create more broken UI.
- **Page transitions are independent:** Can be built in parallel with watchlist fixes.
- **Accessibility audit should come last:** Needs all UI changes finalized before auditing.

## MVP Definition

### Launch With (v1) — This Milestone

- [x] Fix optimistic update propagation across all watchlist-consuming components
- [x] Add "Mark as Watched" quick action on movie cards and detail modal
- [x] Separate visual icons for watched vs want-to-watch on movie cards
- [x] Framer Motion page transitions
- [x] Responsive fixes across breakpoints
- [x] Accessibility audit (WCAG 2.1 AA)
- [x] Final build + lint pass

### Add After Validation (v1.x)

- [ ] Passkey/WebAuthn authentication — when Supabase MFA support is ready
- [ ] Auth form refactor to shadcn FormField — when touching auth forms for other reasons

### Future Consideration (v2+)

- [ ] Premium tier with higher AI rate limits
- [ ] Social features (share watchlist, follow friends)
- [ ] Mobile native app

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Fix optimistic updates (BACKLOG-16,17,19) | HIGH | LOW | P1 |
| Separate status icons (BACKLOG-18) | HIGH | LOW | P1 |
| Mark as Watched action (BACKLOG-15) | HIGH | MEDIUM | P1 |
| Final build/lint validation (POLISH-05) | HIGH | LOW | P1 |
| Responsive testing (POLISH-03) | MEDIUM | MEDIUM | P2 |
| Page transitions (POLISH-01) | MEDIUM | MEDIUM | P2 |
| Accessibility audit (POLISH-04) | MEDIUM | MEDIUM | P2 |

## Competitor Feature Analysis

| Feature | Netflix | Letterboxd | IMDb | Our Approach |
|---------|---------|------------|------|--------------|
| Add to list | Single "My List" button, instant toggle | "Watchlist" + "Watched" separate buttons | "Watchlist" button | Two buttons: bookmark (want to watch) + eye (watched) |
| Status icons | Checkmark in My List | Eye = watched, Clock = want to watch | Bookmark = in list | Bookmark = want to watch, Eye = watched, filled = active |
| Mutation feedback | Instant, no spinner | Instant, brief toast | Instant | Fix: optimistic update before server response |
| Rating | Thumbs up/down | 5-star + like | 10-star | Like/dislike (thumbs), fix instant feedback |
| Page transitions | Smooth fade/slide | Minimal | None | Framer Motion fade + slight slide |

## Sources

- Netflix web app — observed UX patterns
- Letterboxd — watchlist and rating UX
- IMDb — watchlist management
- WCAG 2.1 AA — accessibility requirements

---
*Feature research for: movie watchlist UX & polish*
*Researched: 2026-02-17*
