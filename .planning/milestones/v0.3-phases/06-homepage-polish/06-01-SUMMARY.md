---
phase: 06-homepage-polish
plan: 01
status: complete
completed: 2026-02-23
commit: 77afadf
duration: ~2min
---

## Summary

Replaced crimson `bg-accent` with neutral gray `bg-muted` in the Skeleton component and slowed the pulse animation from 2s to 3s for a calmer loading experience.

## Changes

| File | Change |
|------|--------|
| `components/ui/skeleton.tsx` | `bg-accent` → `bg-muted` |
| `app/globals.css` | Added custom `pulse` keyframes (opacity 1→0.4) and `.animate-pulse` override at 3s duration |

## Decisions

- Pulse opacity range changed to 1→0.4 (slightly more subtle than Tailwind's default 1→0.5)
- Custom keyframes placed inside `@layer base`; utility override placed outside the layer for proper cascade

## Verification

- `npm run build` passes
- No `bg-accent` in `skeleton.tsx`
- All skeleton loading states across every page inherit the fix via the single base component
