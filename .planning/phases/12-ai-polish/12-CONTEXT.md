# Phase 12: AI Polish - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

AI recommendations filter by origin country when the user asks for country-specific content, off-topic queries are redirected gracefully, and full conversations are logged to the database for analytics without adding latency to the streaming response. This phase modifies the existing AI mood chat system — no new pages or routes are created.

</domain>

<decisions>
## Implementation Decisions

### Country Detection
- AI (Gemini) infers origin country from the user's prompt — no hardcoded keyword map
- Single country per suggestion only (no multi-country support)
- Cultural terms always resolve to a country: 'anime' → JP, 'K-drama' → KR, 'Bollywood' → IN, 'telenovela' → MX, 'Nollywood' → NG
- If AI can't confidently determine an origin country, omit `origin_country` entirely — fall back to genre-only results from all countries

### Guardrail Tone & Implementation
- Off-topic redirects are witty and cinematic in tone (e.g., "That's a plot twist I wasn't expecting! I'm your movie mood matchmaker — what kind of vibe are you feeling tonight?")
- Two-layer guardrail: pre-check filter before sending to Gemini (saves API tokens on obviously off-topic queries) + system prompt instructions for nuanced cases
- Broad definition of "on-topic": anything entertainment-adjacent passes through — cultural references (Ghibli, Tarantino), vibes (cozy, intense), real-world events (Oscar winners), actors, directors. Only block clearly non-entertainment queries (cover letters, math homework, etc.)
- Off-topic redirects are plain text responses with no tool call — no genre chips appear

### Conversation Logging
- Log on every genre suggestion (when `suggest_genres` tool is called with output) — off-topic redirects are NOT logged
- Store full AI SDK messages array as-is in the `messages` JSONB column — complete record for debugging and analytics
- Write to both tables: `ai_recommendations` continues genre result logging (existing behavior), `ai_conversations` additionally stores full message history
- Fire-and-forget insert only — never await the DB write
- No user-facing conversation history UI — analytics-only for v0.4. RLS ensures data isolation if exposed later

### Country UX Flow
- `suggest_genres` tool output adds optional `origin_country` field: `{ genres: [...], origin_country?: 'KR' }` — backwards compatible
- Genre suggestion chips in the chat show country-prefixed labels when origin country is present: "Korean Drama", "Japanese Animation". Regular "Drama", "Action" when no country
- Origin country flows to recommendations page via URL search param: `?origin_country=KR` alongside existing `?genres=18,10749`
- Recommendations page heading shows country context: "Korean Drama" instead of just "Drama"

### Claude's Discretion
- Exact pre-check filter implementation (keyword list vs simple classifier)
- System prompt wording for guardrails and country detection instructions
- How to format the country-prefixed genre labels (capitalization, word order)
- Error handling for invalid or unrecognized country codes from AI

</decisions>

<specifics>
## Specific Ideas

- The redirect tone should feel like a charming movie-buff friend, not a corporate chatbot — cinematic personality is on-brand for Moodflix
- Pre-check filter should be lightweight — a simple keyword/pattern check, not a second AI call
- The existing `aiRecommendations` fire-and-forget pattern (`db.insert(aiRecommendations).catch(() => {})`) should be replicated for `aiConversations`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-ai-polish*
*Context gathered: 2026-03-03*
