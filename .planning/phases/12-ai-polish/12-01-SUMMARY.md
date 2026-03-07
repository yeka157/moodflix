---
phase: 12-ai-polish
plan: 01
subsystem: ai
tags: [gemini, ai-sdk, guardrails, tmdb, origin-country, streaming]

# Dependency graph
requires:
  - phase: 08-ai-mood
    provides: AI recommend route, GenreSuggestion type, suggest_genres tool
provides:
  - Off-topic pre-check filter with streaming redirect responses
  - Origin country detection in suggest_genres tool output
  - Two-layer guardrail system (regex pre-check + system prompt)
affects: [12-02, ai-mood-section, discover-content]

# Tech tracking
tech-stack:
  added: []
  patterns: [createUIMessageStream for non-LLM streaming responses, regex pre-check before LLM call]

key-files:
  created: []
  modified:
    - types/ai.ts
    - app/api/ai/recommend/route.ts

key-decisions:
  - "createUIMessageStream + createUIMessageStreamResponse for off-topic redirects -- avoids Gemini call while staying compatible with useChat"
  - "text-delta chunk type with crypto.randomUUID() ID for streaming writer compatibility"
  - "Narrow regex patterns only catch clearly non-entertainment queries -- entertainment-adjacent terms never blocked"

patterns-established:
  - "Pre-check filter pattern: regex guard before LLM call to save API costs on obvious misuse"
  - "Origin country passthrough: tool schema captures ISO country code, passes through to output for downstream TMDB filtering"

requirements-completed: [AIPOL-01, AIPOL-02, AIPOL-04, AIPOL-05, AIPOL-06]

# Metrics
duration: 4min
completed: 2026-03-07
---

# Phase 12 Plan 01: AI Guardrails & Origin Country Summary

**Off-topic regex pre-check with streaming redirects + origin_country field in suggest_genres tool for country-specific content filtering**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-07T02:21:17Z
- **Completed:** 2026-03-07T02:25:00Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Two-layer guardrail: regex pre-check catches obvious off-topic queries before hitting Gemini, system prompt handles edge cases
- Off-topic queries return witty cinematic redirect via createUIMessageStream (no Gemini API cost)
- origin_country field added to GenreSuggestion type and suggest_genres tool for K-drama, anime, Bollywood, etc.
- System prompt updated with ORIGIN COUNTRY DETECTION and OFF-TOPIC HANDLING sections

## Task Commits

Each task was committed atomically:

1. **Task 1: Add origin_country to GenreSuggestion type and update AI route with guardrails + country detection** - `10aa175` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `types/ai.ts` - Added origin_country optional field to GenreSuggestion type
- `app/api/ai/recommend/route.ts` - Added OFF_TOPIC_PATTERNS, REDIRECT_MESSAGES, isOffTopic function, createUIMessageStream redirect, system prompt sections, origin_country in tool schema

## Decisions Made
- Used `createUIMessageStream` + `createUIMessageStreamResponse` (AI SDK v5) for off-topic redirects instead of falling back to streamText -- zero Gemini API cost for obvious off-topic queries
- Used `text-delta` chunk type with `delta` property and `crypto.randomUUID()` for stream writer compatibility (AI SDK v5 chunk format)
- Kept regex patterns intentionally narrow -- only clearly non-entertainment queries (homework, medical, legal, coding, recipes, translation) are caught

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed createUIMessageStream writer API**
- **Found during:** Task 1
- **Issue:** Plan specified `writer.write({ type: "text", text: message })` but AI SDK v5 uses `{ type: "text-delta", delta: message, id: string }` chunk format
- **Fix:** Changed to correct chunk type with `crypto.randomUUID()` for required ID field
- **Files modified:** app/api/ai/recommend/route.ts
- **Verification:** npm run build passes
- **Committed in:** 10aa175

**2. [Rule 1 - Bug] Used createUIMessageStreamResponse instead of manual Response**
- **Found during:** Task 1
- **Issue:** Plan's `new Response(stream.value, ...)` doesn't work -- createUIMessageStream returns a ReadableStream, not an object with `.value`. Needs SSE transform via createUIMessageStreamResponse
- **Fix:** Used `createUIMessageStreamResponse({ stream, status: 200 })` which handles SSE transform and TextEncoder
- **Files modified:** app/api/ai/recommend/route.ts
- **Verification:** npm run build passes
- **Committed in:** 10aa175

---

**Total deviations:** 2 auto-fixed (2 bugs in plan's API assumptions)
**Impact on plan:** Both fixes required for correct AI SDK v5 compatibility. No scope creep.

## Issues Encountered
None beyond the API corrections documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- origin_country field available in tool output for Plan 02 to use in TMDB discover filtering
- Off-topic guardrails active -- mood section will gracefully handle non-entertainment queries

---
*Phase: 12-ai-polish*
*Completed: 2026-03-07*
