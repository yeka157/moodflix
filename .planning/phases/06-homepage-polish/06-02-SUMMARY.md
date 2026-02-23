---
phase: 06-homepage-polish
plan: 02
status: complete
completed: 2026-02-23
commit: 8d1ad50
duration: ~3min
---

## Summary

Added daily rotation to personalized recommendation rows and varied sentence patterns for row labels. Reordered home page sections to the locked layout: Hero → Trending → Recs → Mood → Feature Cards.

## Changes

| File | Change |
|------|--------|
| `lib/recommendations.ts` | Renamed `deterministicIndex` → `deterministicSeed`, added daily seed (`userId + toDateString()`), daily rotation for source movie selection from top-5, `rowPatternIndex` field |
| `types/movie.ts` | Added `rowPatternIndex: number` to `PersonalizedData` type |
| `components/movies/personalized-section.tsx` | Added 6 `ROW_PATTERNS` sentence patterns, consume `rowPatternIndex` for title generation |
| `components/movies/home-movies.tsx` | Reordered: Trending row renders before PersonalizedSection |
| `app/(app)/home/page.tsx` | Moved `<MoodSection />` after `<HomeMovies>` |

## Decisions

- 6 sentence patterns: "Because you liked", "More like", "If you loved", "Since you enjoyed", "Fans of ... also watch", "Picked for you — inspired by"
- Second source movie uses adjusted index to avoid collision with primary
- Daily seed = `userId + new Date().toDateString()` — changes once per day, deterministic per user

## Verification

- `npm run build` passes
- `deterministicSeed` accepts daily-changing seed
- Source movies rotate daily from full top-5 pool
- Users with 0 watchlist items still return null (no rows, no errors)
