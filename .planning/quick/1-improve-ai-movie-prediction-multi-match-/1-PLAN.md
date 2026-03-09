---
phase: quick-1
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - types/ai.ts
  - app/api/ai/recommend/route.ts
  - hooks/use-ai.ts
  - components/ai/shazam-card.tsx
  - components/ai/mood-section.tsx
autonomous: true
requirements: [QUICK-1]
must_haves:
  truths:
    - "When user describes a specific movie/show, AI returns 1-3 ranked matches with confidence scores"
    - "When description is too vague, AI asks a follow-up question instead of guessing"
    - "Genre recommendation mode continues to work unchanged"
    - "Multiple match results render as a ranked list of ShazamCards"
  artifacts:
    - path: "types/ai.ts"
      provides: "IdentifiedMedia[] array type support"
      contains: "IdentifiedMedia"
    - path: "app/api/ai/recommend/route.ts"
      provides: "Multi-match identify_media tool returning 1-3 results"
      contains: "identify_media"
    - path: "components/ai/shazam-card.tsx"
      provides: "Single match card + new multi-match list component"
      exports: ["ShazamCard", "ShazamCardList"]
  key_links:
    - from: "app/api/ai/recommend/route.ts"
      to: "lib/tmdb.ts"
      via: "searchMulti for each candidate title"
      pattern: "searchMulti"
    - from: "hooks/use-ai.ts"
      to: "types/ai.ts"
      via: "extractLatestIdentifiedMedia returns array"
      pattern: "IdentifiedMedia\\[\\]"
    - from: "components/ai/mood-section.tsx"
      to: "components/ai/shazam-card.tsx"
      via: "renders ShazamCardList for multi-match results"
      pattern: "ShazamCardList"
---

<objective>
Upgrade the AI identify_media tool to return 1-3 ranked matches with confidence scores instead of a single result. Add confidence-based routing so vague descriptions trigger follow-up questions.

Purpose: Users describing a movie often get zero or wrong results because the AI commits to a single guess. Multiple ranked matches dramatically improve identification success.
Output: Updated AI endpoint, types, extraction hook, and UI components for multi-match rendering.
</objective>

<execution_context>
@/Users/kevin/.claude/get-shit-done/workflows/execute-plan.md
@/Users/kevin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@types/ai.ts
@app/api/ai/recommend/route.ts
@hooks/use-ai.ts
@components/ai/shazam-card.tsx
@components/ai/mood-section.tsx
@lib/tmdb.ts

<interfaces>
<!-- Key types and contracts the executor needs -->

From types/ai.ts:
```typescript
export type IdentifiedMedia = {
  title: string;
  tmdbId: number;
  mediaType: MediaType;
  year?: string;
  confidence: "high" | "medium" | "low";
  verified: boolean;
  posterPath: string | null;
  overview: string | null;
};
```

From lib/tmdb.ts:
```typescript
export async function searchMulti(query: string, page?: number): Promise<{
  results: Array<{
    id: number;
    media_type: string;
    title?: string;
    name?: string;
    poster_path: string | null;
    overview: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average?: number;
  }>;
}>;
```

From hooks/use-ai.ts:
```typescript
export function useMoodChat(): {
  ...chat,
  genreSuggestion: GenreSuggestion | null;
  identifiedMedia: IdentifiedMedia | null;  // Currently single, will become array
};
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Multi-match identify_media tool + types + system prompt</name>
  <files>types/ai.ts, app/api/ai/recommend/route.ts</files>
  <action>
**types/ai.ts changes:**
- Keep existing `IdentifiedMedia` type unchanged (still represents a single match).
- Add new type `IdentifiedMediaResult`:
```typescript
export type IdentifiedMediaResult = {
  matches: IdentifiedMedia[];
  query: string; // The AI's interpretation of what user described
};
```

**app/api/ai/recommend/route.ts changes:**

1. Update the `identify_media` tool's `inputSchema` to accept 1-3 candidates instead of 1:
   - Change `title` to `candidates` array (1-3 items), each with `title: string`, `mediaType: "movie" | "tv"`, `year?: string`, `confidence: "high" | "medium" | "low"`
   - Add `query: string` field describing what the AI thinks the user is looking for
   - Remove the single `title`, `mediaType`, `year`, `confidence` top-level fields

   Schema:
   ```
   inputSchema: z.object({
     query: z.string().describe("Brief summary of what the user is describing"),
     candidates: z.array(z.object({
       title: z.string(),
       mediaType: z.enum(["movie", "tv"]),
       year: z.string().optional(),
       confidence: z.enum(["high", "medium", "low"]),
     })).min(1).max(3),
   })
   ```

2. Update the `execute` function to search TMDB for EACH candidate:
   - Loop over `params.candidates`, call `searchMulti(candidate.title)` for each
   - For each candidate, find best match same way as current code (prefer exact media type match)
   - Build an array of `IdentifiedMedia` results (verified matches)
   - Filter out unverified (tmdbId === 0) results
   - Return `{ matches: [...verifiedResults], query: params.query }` (type `IdentifiedMediaResult`)

3. Update the system prompt's MEDIA IDENTIFICATION section:
   - Replace the current instructions with:
   ```
   MEDIA IDENTIFICATION:
   When a user describes a specific movie or TV show (mentions specific scenes, plot points, characters, quotes, or distinctive elements), identify it by calling identify_media with 1-3 candidate matches ranked by confidence.

   Confidence routing:
   - If you're quite sure (one clear match): provide 1 candidate with "high" confidence
   - If it could be 2-3 things: provide all candidates ranked by confidence
   - If the description is too vague to identify anything specific (no plot points, no characters, no distinctive scenes -- just a general vibe): do NOT call identify_media. Instead, ask ONE specific follow-up question to narrow it down (e.g., "Do you remember any actors?" or "Was it animated or live-action?")

   Examples:
   - "the movie where the guy grows potatoes on Mars" -> 1 candidate: The Martian (high)
   - "that movie about time loops" -> 3 candidates: Groundhog Day (high), Edge of Tomorrow (medium), Palm Springs (medium)
   - "some movie I saw once about a dog" -> TOO VAGUE, ask follow-up question
   ```

4. Update conversation logging in the execute function to handle the new return shape (log `Identified: title1, title2, ...` from matches array).

Keep `suggest_genres` tool completely unchanged. Keep all other endpoint logic (auth, rate limit, off-topic) unchanged.
  </action>
  <verify>
    <automated>cd /Users/kevin/Repository/moodflix && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>identify_media tool accepts 1-3 candidates, searches TMDB for each, returns { matches: IdentifiedMedia[], query: string }. System prompt instructs AI to use confidence routing. TypeScript compiles cleanly.</done>
</task>

<task type="auto">
  <name>Task 2: Update extraction hook + UI for multi-match rendering</name>
  <files>hooks/use-ai.ts, components/ai/shazam-card.tsx, components/ai/mood-section.tsx</files>
  <action>
**hooks/use-ai.ts changes:**
- Change `extractLatestIdentifiedMedia` to return `IdentifiedMediaResult | null` instead of `IdentifiedMedia | null`
- Detection: check for `"matches" in output && Array.isArray(output.matches)` instead of `"tmdbId" in output`
- Update `useMoodChat` return type: `identifiedMedia` becomes `IdentifiedMediaResult | null`
- Also update the per-message extraction function `getMessageIdentifiedMedia` in mood-section.tsx (same logic)

**components/ai/shazam-card.tsx changes:**
- Keep existing `ShazamCard` component unchanged (renders one match)
- Add new `ShazamCardList` component:
  ```typescript
  type ShazamCardListProps = {
    matches: IdentifiedMedia[];
    query: string;
  };
  ```
  - If `matches.length === 0`: render "Couldn't find a match" fallback (reuse existing tmdbId===0 card style)
  - If `matches.length === 1`: render single `ShazamCard` (same as today)
  - If `matches.length > 1`: render a vertical stack of ShazamCards with a small header "Could be one of these:" and confidence badges on each card
  - Add a confidence badge to `ShazamCard` via optional `showConfidence?: boolean` prop. When true, show a small badge: green for "high", yellow for "medium", red/muted for "low". Use existing `Badge` component with appropriate variant.
  - Confidence badge positioned top-right of the card, small text like "95% match" -> map high="High match", medium="Possible match", low="Long shot"

**components/ai/mood-section.tsx changes:**
- Update `getMessageIdentifiedMedia` to return `IdentifiedMediaResult | null` (check `"matches" in output`)
- Replace the `ShazamCard` render block (lines ~212-227) with `ShazamCardList`:
  ```tsx
  {msgMedia && msgMedia.matches.length > 0 && !isStreaming && (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start pl-9"
    >
      <ShazamCardList matches={msgMedia.matches} query={msgMedia.query} />
    </motion.div>
  )}
  ```
- Update import to use `ShazamCardList` from shazam-card
- Remove `IdentifiedMedia` import, add `IdentifiedMediaResult` import
  </action>
  <verify>
    <automated>cd /Users/kevin/Repository/moodflix && npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>Multi-match results render as a ranked list of ShazamCards with confidence badges. Single matches render identically to before. Build passes with no errors.</done>
</task>

</tasks>

<verification>
1. `npm run build` passes with no TypeScript or build errors
2. `npm run lint` passes
3. Manual test: describe a well-known movie ("the movie where the guy grows potatoes on Mars") -- should return 1 high-confidence match
4. Manual test: describe something ambiguous ("that movie about time loops") -- should return 2-3 ranked matches
5. Manual test: give a vague description ("some movie about a dog") -- AI should ask a follow-up question
6. Manual test: mood description ("I feel sad") -- should still trigger genre suggestions (unchanged)
</verification>

<success_criteria>
- identify_media returns 1-3 TMDB-verified matches ranked by confidence
- Vague descriptions trigger follow-up questions instead of bad guesses
- Genre recommendation mode is completely unchanged
- Multi-match UI shows ranked cards with confidence indicators
- Single-match UI looks identical to current behavior
- Build and lint pass cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/1-improve-ai-movie-prediction-multi-match-/1-SUMMARY.md`
</output>
