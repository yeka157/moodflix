# Phase 12: AI Polish - Research

**Researched:** 2026-03-06
**Domain:** AI prompt engineering, TMDB origin country filtering, off-topic guardrails
**Confidence:** HIGH

## Summary

Phase 12 modifies the existing AI mood chat system to support origin country filtering (AIPOL-01/02/03), off-topic guardrails (AIPOL-04), and conversation logging (AIPOL-05/06 -- already complete in Phase 9). The changes are concentrated in four areas: (1) the AI route's system prompt and tool schema, (2) a lightweight pre-check filter before Gemini, (3) the recommendations page URL params and TMDB discover calls, and (4) the mood section UI for country-prefixed genre labels.

No new pages, routes, database tables, or migrations are needed. The `ai_conversations` table and fire-and-forget logging already exist. The TMDB `with_origin_country` parameter is already used in `discoverKoreanDramas` and `discoverChineseDramas` functions in `lib/tmdb.ts`, confirming the pattern works.

**Primary recommendation:** Extend the existing `suggest_genres` tool schema with an optional `origin_country` field, add system prompt instructions for country inference, implement a simple keyword-based pre-check filter, and thread `origin_country` through the recommendations URL and TMDB discover calls.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- AI (Gemini) infers origin country from the user's prompt -- no hardcoded keyword map
- Single country per suggestion only (no multi-country support)
- Cultural terms always resolve to a country: 'anime' -> JP, 'K-drama' -> KR, 'Bollywood' -> IN, 'telenovela' -> MX, 'Nollywood' -> NG
- If AI can't confidently determine an origin country, omit `origin_country` entirely -- fall back to genre-only results from all countries
- Off-topic redirects are witty and cinematic in tone
- Two-layer guardrail: pre-check filter before sending to Gemini + system prompt instructions for nuanced cases
- Broad definition of "on-topic": anything entertainment-adjacent passes through
- Off-topic redirects are plain text responses with no tool call -- no genre chips appear
- Log on every genre suggestion (when `suggest_genres` tool is called with output) -- off-topic redirects are NOT logged
- Store full AI SDK messages array as-is in the `messages` JSONB column
- Write to both tables: `ai_recommendations` continues genre result logging, `ai_conversations` additionally stores full message history
- Fire-and-forget insert only -- never await the DB write
- No user-facing conversation history UI -- analytics-only for v0.4
- `suggest_genres` tool output adds optional `origin_country` field: `{ genres: [...], origin_country?: 'KR' }`
- Genre suggestion chips show country-prefixed labels when origin country is present: "Korean Drama", "Japanese Animation"
- Origin country flows to recommendations page via URL search param: `?origin_country=KR`
- Recommendations page heading shows country context: "Korean Drama" instead of just "Drama"

### Claude's Discretion
- Exact pre-check filter implementation (keyword list vs simple classifier)
- System prompt wording for guardrails and country detection instructions
- How to format the country-prefixed genre labels (capitalization, word order)
- Error handling for invalid or unrecognized country codes from AI

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AIPOL-01 | AI recommendations support origin country filtering | TMDB `with_origin_country` param on `/discover/movie` and `/discover/tv` -- already proven in `discoverKoreanDramas()` |
| AIPOL-02 | AI suggest_genres tool outputs optional origin_country (ISO 3166-1 alpha-2) | Add `origin_country` to tool's `inputSchema` as optional z.string() |
| AIPOL-03 | Origin country parameter propagates through recommendations page URL to TMDB discover API call | Thread via `?origin_country=KR` search param -> SSR page -> `discoverMoviesByGenre`/`discoverTVByGenre` with added param |
| AIPOL-04 | AI chatbot restricts off-topic queries with graceful redirect | Two-layer: pre-check keyword filter + system prompt guardrail instructions |
| AIPOL-05 | Full AI conversation logged to database when genre suggestion is made | **ALREADY COMPLETE** (Phase 9) -- `aiConversations` insert exists in route |
| AIPOL-06 | AI conversation logging is fire-and-forget | **ALREADY COMPLETE** (Phase 9) -- `.catch(() => {})` pattern in place |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ai (Vercel AI SDK) | v5 | Streaming chat, tool calling | Already in use for mood chat |
| @ai-sdk/google | latest | Gemini provider | Already configured |
| zod | latest | Tool schema validation | Already in use |

### No New Dependencies
This phase requires zero new packages. All changes are to existing files using existing libraries.

## Architecture Patterns

### Current Data Flow (What Exists)
```
User input -> MoodSection -> useMoodChat -> /api/ai/recommend
  -> Gemini streamText with suggest_genres tool
  -> tool output: { genres, moodSummary, media_type, confirmed }
  -> MoodSection reads genreSuggestion, shows genre chips
  -> "Show me movies" button -> /home/recommendations?genres=X&mood=Y&type=Z
  -> SSR: discoverMoviesByGenre(genres) or discoverTVByGenre(genres)
  -> Client: useDiscoverByGenre / useDiscoverTVByGenre for infinite scroll
```

### Modified Data Flow (What Changes)
```
User input -> PRE-CHECK FILTER (new)
  -> Off-topic? Return plain text redirect, skip Gemini entirely
  -> On-topic? Continue to Gemini

Gemini streamText with UPDATED suggest_genres tool
  -> tool output: { genres, moodSummary, media_type, origin_country?, confirmed }
  -> MoodSection reads genreSuggestion
  -> Genre chips show COUNTRY-PREFIXED labels when origin_country present
  -> "Show me movies" button -> /home/recommendations?genres=X&mood=Y&type=Z&origin_country=KR
  -> SSR: discoverMoviesByGenre(genres, { originCountry: 'KR' })
  -> TMDB: /discover/movie?with_genres=18&with_origin_country=KR
  -> Client: hooks pass origin_country through API routes
```

### Files to Modify

| File | Change |
|------|--------|
| `app/api/ai/recommend/route.ts` | Add pre-check filter, update system prompt, add `origin_country` to tool schema |
| `types/ai.ts` | Add `origin_country?: string` to `GenreSuggestion` |
| `hooks/use-ai.ts` | No change needed -- `genreSuggestion` already passes through full tool output |
| `components/ai/mood-section.tsx` | Country-prefix genre chip labels, pass `origin_country` to URL |
| `app/(app)/home/recommendations/page.tsx` | Read `origin_country` from searchParams, pass to TMDB discover, update heading |
| `lib/tmdb.ts` | Add `originCountry` param to `discoverMoviesByGenre` and `discoverTVByGenre` |
| `components/ai/recommendations-grid.tsx` | Accept and pass `originCountry` prop |
| `hooks/use-movies.ts` | Accept `originCountry` in `fetchGenreDiscover` and pass to API route |
| `hooks/use-tv.ts` | Accept `originCountry` in `fetchTVGenreDiscover` and pass to API route |
| `app/api/movies/route.ts` | Read `origin_country` param and pass to `discoverMoviesByGenre` |
| `app/api/tv/route.ts` | Read `origin_country` param and pass to `discoverTV`/`discoverTVByGenre` |

### Pattern 1: Pre-Check Filter (Off-Topic Detection)

**What:** A simple keyword/regex-based filter that runs before sending to Gemini to save API tokens on obviously off-topic queries.

**Recommendation:** Use a blocklist approach -- a small set of patterns that indicate clearly non-entertainment queries. Everything else passes through to Gemini, which handles nuanced cases via system prompt.

```typescript
// In app/api/ai/recommend/route.ts

const OFF_TOPIC_PATTERNS = [
  /\b(write|draft|compose)\b.*(essay|letter|email|resume|cover letter)/i,
  /\b(solve|calculate|compute)\b.*(math|equation|problem)/i,
  /\b(code|program|debug|fix)\b.*(javascript|python|css|html|bug)/i,
  /\b(recipe|cook|bake|ingredient)/i,
  /\b(homework|assignment|exam|test\s+prep)/i,
  /\b(medical|diagnosis|symptom|prescription)/i,
  /\b(legal|lawsuit|contract|attorney)/i,
  /\b(translate|translation)\b/i,
];

const REDIRECT_MESSAGES = [
  "That's a plot twist I wasn't expecting! I'm your movie mood matchmaker -- what kind of vibe are you feeling tonight?",
  "Whoa, wrong set! I'm the movie expert around here. Tell me what mood you're in and I'll find the perfect watch.",
  "Cut! That's not in my script. But I do know a thing or two about finding the perfect movie for your mood. What are you feeling?",
];

function isOffTopic(text: string): boolean {
  return OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(text));
}
```

**Key design choice:** The filter is intentionally narrow (high precision, not high recall). Entertainment-adjacent queries like cultural references, actor names, vibes, and Ghibli should NEVER be caught by the pre-check -- only clearly non-entertainment queries. Gemini handles the grey area via system prompt.

### Pattern 2: System Prompt for Country Detection

**What:** Extended system prompt instructions that tell Gemini to detect origin country from cultural context and output it in the tool call.

```typescript
const systemPrompt = `You are Moodflix AI, a friendly movie and TV show mood expert...

ORIGIN COUNTRY DETECTION:
When the user references content from a specific country or culture, include the origin_country field (ISO 3166-1 alpha-2 code) in your suggest_genres call. Examples:
- "K-drama", "Korean drama" → origin_country: "KR", media_type: "tv"
- "anime", "Japanese animation" → origin_country: "JP"
- "Bollywood" → origin_country: "IN"
- "telenovela" → origin_country: "MX", media_type: "tv"
- "Nollywood" → origin_country: "NG"
- "British comedy" → origin_country: "GB"
- "French cinema" → origin_country: "FR"
If you cannot confidently determine an origin country, do NOT include origin_country — just suggest genres without it.

OFF-TOPIC HANDLING:
You are ONLY a movie and TV show recommendation assistant. If the user asks about non-entertainment topics (homework, coding, recipes, medical advice, etc.), gently redirect them to movie/TV topics with a witty, cinematic response. Do NOT call suggest_genres for off-topic queries.
However, be BROAD about what counts as entertainment-related. Cultural references (Ghibli, Tarantino), vibes (cozy, intense), real-world events (Oscar winners), actors, directors — all of these are on-topic.`;
```

### Pattern 3: Country-Prefixed Genre Labels

**What:** When `origin_country` is present in the tool output, genre chip labels get prefixed with the country name.

```typescript
// Country code to adjective map for display
const COUNTRY_LABELS: Record<string, string> = {
  KR: "Korean",
  JP: "Japanese",
  IN: "Indian",
  MX: "Mexican",
  NG: "Nigerian",
  GB: "British",
  FR: "French",
  CN: "Chinese",
  TW: "Taiwanese",
  TH: "Thai",
  ES: "Spanish",
  IT: "Italian",
  DE: "German",
  BR: "Brazilian",
};

function getCountryLabel(countryCode: string): string | undefined {
  return COUNTRY_LABELS[countryCode.toUpperCase()];
}

// Usage in mood-section.tsx genre chips:
// If origin_country = "KR" and genre = "Drama" -> display "Korean Drama"
// If no origin_country -> display "Drama" as before
```

### Pattern 4: TMDB Origin Country in Discover Calls

**What:** Thread `with_origin_country` through existing discover functions.

```typescript
// lib/tmdb.ts - extend existing functions
export async function discoverMoviesByGenre(
  genreIds: string,
  page = 1,
  originCountry?: string,
) {
  const params: Record<string, string> = {
    with_genres: genreIds,
    sort_by: "popularity.desc",
    page: String(page),
    include_adult: "false",
  };
  if (originCountry) params.with_origin_country = originCountry;
  return tmdbFetch<MovieListResponse>("/discover/movie", params);
}

// Same pattern for discoverTVByGenre
```

### Anti-Patterns to Avoid
- **Second AI call for pre-check:** Do NOT use another LLM call to classify on/off-topic. A simple regex check is sufficient and costs zero tokens.
- **Hardcoded country-to-genre map:** The AI should infer genres from mood + country context. Don't map "K-drama" to genre ID 18 in code -- let Gemini decide the genre.
- **Blocking on country validation:** If the AI returns an unrecognized country code, just pass it through. TMDB will return results (potentially empty), which is fine.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Country code validation | Custom ISO 3166-1 validator | Pass-through to TMDB | TMDB handles invalid codes gracefully (returns empty results) |
| Off-topic NLP classifier | ML/LLM-based classifier | Simple regex blocklist | The system prompt handles nuanced cases; pre-check only catches obvious ones |
| Country name mapping | External i18n library | Simple Record<string, string> | Only need ~15 country adjectives, not full i18n |

## Common Pitfalls

### Pitfall 1: Pre-Check Filter Too Aggressive
**What goes wrong:** Filter catches entertainment-adjacent queries like "something like Studio Ghibli" because it matches a pattern.
**Why it happens:** Over-fitting the blocklist patterns.
**How to avoid:** Make blocklist patterns highly specific (multi-word phrases, not single keywords). Test against the success criteria examples. "Ghibli", "Tarantino", "Oscar" should NEVER match.
**Warning signs:** Users getting redirect messages when asking about movies/shows.

### Pitfall 2: Origin Country on Search API
**What goes wrong:** Trying to use `with_origin_country` on TMDB's `/search/movie` or `/search/tv` endpoint.
**Why it happens:** Confusion between search and discover endpoints.
**How to avoid:** Origin country ONLY works on `/discover/movie` and `/discover/tv`. The existing recommendations flow already uses discover, so this shouldn't be an issue. Already documented in REQUIREMENTS.md Out of Scope.

### Pitfall 3: Gemini Not Using Tool Schema Optional Fields
**What goes wrong:** Gemini ignores the `origin_country` field even when the user mentions a specific country.
**Why it happens:** Optional fields in tool schemas need explicit system prompt instructions.
**How to avoid:** The system prompt MUST include examples of when to use `origin_country`. List the common cultural terms and their mappings directly in the prompt.

### Pitfall 4: Pre-Check Returns Invalid Stream Format
**What goes wrong:** When the pre-check filter catches an off-topic query, the response format doesn't match what `useChat` expects.
**Why it happens:** The client uses AI SDK's `useChat` which expects a specific streaming format via `toUIMessageStreamResponse()`.
**How to avoid:** For pre-check redirects, still use `streamText` or manually construct a compatible stream response. The simplest approach: use `streamText` with the redirect message and no tools, bypassing Gemini entirely by returning a static text stream. Alternatively, create a `UIMessageStreamWriter` that writes a single text part.

### Pitfall 5: Infinite Scroll Doesn't Pass Origin Country
**What goes wrong:** First page shows country-filtered results, but subsequent pages load without the filter.
**Why it happens:** The infinite scroll hooks (`useDiscoverByGenre`, `useDiscoverTVByGenre`) and API routes don't thread `origin_country` through.
**How to avoid:** Thread `origin_country` through: URL search params -> RecommendationsGrid props -> hooks -> API routes -> TMDB calls. Every layer must pass it.

## Code Examples

### Pre-Check Filter Response (Bypassing Gemini)
```typescript
// Option A: Use streamText with a no-op model that returns static text
// This is complex. Simpler approach:

// Option B: Construct a manual UIMessage stream response
import { createUIMessageStream } from "ai";

function createRedirectResponse(): Response {
  const message = REDIRECT_MESSAGES[Math.floor(Date.now() % REDIRECT_MESSAGES.length)];

  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({ type: "text", text: message });
    },
  });

  return new Response(stream.value, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}
```

**Confidence:** MEDIUM -- The `createUIMessageStream` API needs verification against AI SDK v5 current docs. Alternative approach: just let Gemini handle all off-topic detection via system prompt and skip the pre-check layer entirely for MVP, adding it as an optimization later.

### Tool Schema with Origin Country
```typescript
suggest_genres: tool({
  description: "Suggest TMDB genres that match the user's mood...",
  inputSchema: z.object({
    genres: z.array(z.object({
      id: z.number(),
      name: z.string(),
    })).min(1).max(3),
    moodSummary: z.string(),
    media_type: z.enum(["movie", "tv"]).default("movie"),
    origin_country: z.string()
      .length(2)
      .optional()
      .describe("ISO 3166-1 alpha-2 country code when user requests content from a specific country/culture"),
  }),
  execute: async (params) => {
    // ... existing validation logic ...
    return {
      ...validatedParams,
      origin_country: params.origin_country,
      confirmed: true,
    };
  },
}),
```

### Recommendations Page with Origin Country
```typescript
// app/(app)/home/recommendations/page.tsx
export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<{ genres?: string; mood?: string; type?: string; origin_country?: string }>;
}) {
  const { genres, mood, type, origin_country } = await searchParams;
  // ... existing logic ...

  let initialMovies: Movie[];
  if (mediaType === "tv") {
    const tvPage = await discoverTVByGenre(genres, 1, origin_country);
    initialMovies = tvPage.results.map(normalizeTVShow);
  } else {
    const moviePage = await discoverMoviesByGenre(genres, 1, origin_country);
    initialMovies = moviePage.results;
  }

  // Country-prefixed heading
  const countryLabel = origin_country ? COUNTRY_LABELS[origin_country] : undefined;
  const displayGenreNames = countryLabel
    ? genreNames.map((name) => `${countryLabel} ${name}`)
    : genreNames;

  // ... render with displayGenreNames ...
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No country filtering | `with_origin_country` on TMDB discover | Available since 2022+ | Enables K-drama, anime, Bollywood filtering |
| No off-topic handling | System prompt + pre-check filter | This phase | Prevents AI misuse, saves tokens |
| AI SDK v4 `parameters` | AI SDK v5 `inputSchema` | AI SDK v5 | Already migrated in codebase |

## Open Questions

1. **Pre-check filter response format**
   - What we know: The client uses `useChat` which expects AI SDK streaming format
   - What's unclear: Exact API for manually constructing a UIMessage stream in AI SDK v5 without calling an LLM
   - Recommendation: Verify `createUIMessageStream` API. Fallback: let Gemini handle all off-topic detection (system prompt only) and skip the pre-check for now, or return a regular JSON error that the client handles specially

2. **TMDB `with_origin_country` on `/discover/movie`**
   - What we know: Works on `/discover/tv` (proven in existing `discoverKoreanDramas`)
   - What's unclear: Whether movie discover handles it identically
   - Recommendation: HIGH confidence it works -- TMDB docs list it for both endpoints, and web search confirms usage

## Sources

### Primary (HIGH confidence)
- Existing codebase: `app/api/ai/recommend/route.ts`, `lib/tmdb.ts`, `drizzle/schema.ts`
- Existing pattern: `discoverKoreanDramas()` already uses `with_origin_country: "KR"`
- TMDB API docs confirm `with_origin_country` on both discover endpoints

### Secondary (MEDIUM confidence)
- [TMDB API Reference - Discover Movie](https://developer.themoviedb.org/reference/discover-movie) - `with_origin_country` parameter
- [TMDB Community - origin_country filter](https://www.themoviedb.org/talk/624a78c38c7b0f009a14f3fc) - confirms parameter availability
- AI SDK v5 `createUIMessageStream` API -- needs verification for pre-check response pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all changes to existing code
- Architecture: HIGH - straightforward extension of existing patterns (tool schema, URL params, TMDB calls)
- Pitfalls: HIGH - pre-check filter scope and infinite scroll threading are well-understood risks
- Pre-check response format: MEDIUM - exact AI SDK v5 API for manual stream construction needs verification

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable -- no fast-moving dependencies)
