# RAG-Grounded AI Recommendations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **For humans (Kevin):** each task is independently shippable and ends with a
> verification step. Code blocks are working reference implementations — read
> them, understand them, then write/adapt them yourself. "Why" notes explain
> the reasoning so you're never typing blind.

**Spec:** `docs/superpowers/specs/2026-07-16-rag-recommendations-design.md`

**Goal:** Mood chat recommends 5–8 real, personalized titles (poster cards with
per-title reasons), retrieved from a ~10k-title vector catalog in Supabase
pgvector — hallucination structurally impossible.

**Architecture:** Agentic RAG inside the existing `/api/ai/recommend` route.
New `recommend_titles` tool embeds a model-distilled mood query, blends it with
a per-user taste vector, runs pgvector cosine top-30, and a
`present_recommendations` tool validates the model's picks against the
candidate set before the UI renders them.

**Tech stack:** pgvector (Supabase), Drizzle ORM 0.45 (`vector` type,
`cosineDistance`), AI SDK (`ai@6`, note: CLAUDE.md says v5 — v5 API shapes
still apply), `@ai-sdk/google` embeddings (`gemini-embedding-001`, 768 dims).

## Global constraints

- TypeScript strict, **zero `any`** — use `unknown` + narrowing. All shared types in `types/`.
- New tables appended at **end** of `drizzle/schema.ts`.
- Migrations: `npm run db:generate` → `npm run db:migrate` (uses `DATABASE_URL_DIRECT`). Never edit applied migrations.
- RLS: append to `drizzle/rls-policies.sql`, apply manually in Supabase SQL Editor.
- Runtime Drizzle queries must scope by `userId` explicitly (Drizzle bypasses RLS).
- AI route rules (`.claude/rules/ai-endpoints.md`): auth mandatory, rate limit unchanged, 500-char input cap, `maxOutputTokens: 1000`.
- Server actions returning Drizzle rows: `Date` → ISO string.
- Embedding model everywhere: `gemini-embedding-001`, `outputDimensionality: 768`, re-normalized. Corpus: `taskType: 'RETRIEVAL_DOCUMENT'`; queries: `taskType: 'RETRIEVAL_QUERY'`.
- Cosine distance only (`cosineDistance` helper / `<=>`).
- No test framework in repo: verification = `npm run build` + `npm run lint` + `tsx` smoke scripts + Playwright QA with screenshot evidence (per QA convention).
- Conventional Commits.

## File map

| File | Status | Responsibility |
|---|---|---|
| `drizzle/schema.ts` | modify | `media_embeddings` table; `taste_vector` on profiles; `mood_embedding` on ai_recommendations |
| `drizzle/rls-policies.sql` | modify | RLS for `media_embeddings` |
| `lib/embeddings.ts` | create | Embed helpers: `embedQuery`, `embedDocuments`, `composeMediaText`, `normalize` |
| `scripts/seed-embeddings.ts` | create | One-off corpus seed (TMDB exports → hydrate → embed → insert) |
| `scripts/test-retrieval.ts` | create | Retrieval-quality smoke script (15 fixed queries) |
| `lib/taste-vector.ts` | create | Taste weights + `recomputeTasteVector(userId)` |
| `actions/watchlist.ts` | modify | Fire-and-forget taste recompute after mutations |
| `lib/retrieval.ts` | create | `searchCatalog()` — blend + pgvector query + exclusions |
| `app/api/ai/recommend/route.ts` | modify | `recommend_titles` + `present_recommendations` tools, prompt, fallback |
| `types/ai.ts` | modify | `RecommendedTitle`, `RecommendationsResult` |
| `hooks/use-ai.ts` | modify | Extract picks from tool parts |
| `components/ai/recommendation-cards.tsx` | create | Poster cards + reasons |
| `components/ai/mood-section.tsx` | modify | Render cards |

---

### Task 1: pgvector extension + schema + migration + RLS

**Why:** Everything downstream needs the columns. pgvector must be enabled
*before* the migration referencing `vector(768)` runs, or `db:migrate` fails
with `type "vector" does not exist`.

**Files:** Modify `drizzle/schema.ts`, `drizzle/rls-policies.sql`.

**Produces (later tasks rely on):** `mediaEmbeddings` table object with columns
`tmdbId`, `mediaType`, `embedding`, `originCountries`, `embeddedAt`;
`profiles.tasteVector`, `profiles.tasteUpdatedAt`;
`aiRecommendations.moodEmbedding`.

- [ ] **Step 1: Enable extension** — Supabase Dashboard → SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

(Or Dashboard → Database → Extensions → enable `vector`.)

- [ ] **Step 2: Schema changes** — append table at END of `drizzle/schema.ts`;
add columns to existing tables. Import `vector` and `index` from
`drizzle-orm/pg-core`.

```ts
// added to profiles:
tasteVector: vector("taste_vector", { dimensions: 768 }),
tasteUpdatedAt: timestamp("taste_updated_at"),

// added to aiRecommendations:
moodEmbedding: vector("mood_embedding", { dimensions: 768 }),

// appended at end of file:
export const mediaEmbeddings = pgTable(
  "media_embeddings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tmdbId: integer("tmdb_id").notNull(),
    mediaType: mediaTypeEnum("media_type").notNull(),
    embedding: vector("embedding", { dimensions: 768 }).notNull(),
    // denormalized from TMDB details so retrieval can filter by country
    // without a JSONB join (deviation from spec: spec had no column; the
    // alternative — detailsData->'origin_country' JSONB probing — is slower
    // and uglier)
    originCountries: text("origin_countries").array(),
    embeddedAt: timestamp("embedded_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("media_embeddings_tmdb_media_unique").on(
      table.tmdbId,
      table.mediaType,
    ),
    index("media_embeddings_cosine_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);
```

- [ ] **Step 3: Generate + apply migration**

Run: `npm run db:generate` → inspect the new file in `drizzle/migrations/`
(expect `CREATE TABLE media_embeddings`, `vector(768)`, `USING hnsw`), then
`npm run db:migrate`.
Expected: applies cleanly (extension already enabled in Step 1).

- [ ] **Step 4: RLS** — append to `drizzle/rls-policies.sql` and run the block
in Supabase SQL Editor:

```sql
-- media_embeddings: server-only (Drizzle owner connection); no client access
ALTER TABLE public.media_embeddings ENABLE ROW LEVEL SECURITY;
```

No policies on purpose — RLS enabled with zero policies denies all
PostgREST/client access; the Drizzle connection bypasses RLS as table owner.

- [ ] **Step 5: Verify**

```bash
psql "$DATABASE_URL_DIRECT" -c "\d media_embeddings"
psql "$DATABASE_URL_DIRECT" -c "select relrowsecurity from pg_class where relname='media_embeddings';"
```

Expected: table with `embedding | vector(768)`, hnsw index listed,
`relrowsecurity = t`. Then `npm run build` passes.

- [ ] **Step 6: Commit** — `feat(db): add media_embeddings + taste/mood vector columns`

---

### Task 2: `lib/embeddings.ts` — embedding helpers

**Why:** One module owns model id, dimensionality, task types, normalization —
seed script, retrieval, and route all import from here so they can never
drift apart (e.g. corpus embedded at 768 but queries at 3072 would silently
return garbage similarity).

**Gotcha this module encodes:** Gemini pre-normalizes only 3072-dim output.
At `outputDimensionality: 768` (MRL truncation) vectors come back
non-unit-length — cosine tolerates that, but normalizing keeps similarity
scores in a sane, comparable range. Normalize everything on the way out.

**Files:** Create `lib/embeddings.ts`.

**Produces:**
- `embedQuery(text: string): Promise<number[]>` — RETRIEVAL_QUERY, normalized
- `embedDocuments(texts: string[]): Promise<number[][]>` — RETRIEVAL_DOCUMENT, normalized
- `composeMediaText(input: MediaTextInput): string`
- `normalize(v: number[]): number[]`
- `EMBEDDING_DIMS = 768`

```ts
import { google } from "@ai-sdk/google";
import { embed, embedMany } from "ai";

export const EMBEDDING_DIMS = 768;
const model = google.embedding("gemini-embedding-001");

export function normalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  if (norm < 1e-10) return v;
  return v.map((x) => x / norm);
}

export async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model,
    value: text,
    providerOptions: {
      google: { outputDimensionality: EMBEDDING_DIMS, taskType: "RETRIEVAL_QUERY" },
    },
  });
  return normalize(embedding);
}

export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model,
    values: texts,
    providerOptions: {
      google: { outputDimensionality: EMBEDDING_DIMS, taskType: "RETRIEVAL_DOCUMENT" },
    },
  });
  return embeddings.map(normalize);
}

export type MediaTextInput = {
  title: string;
  year: string | null;          // "2018"
  originWords: string | null;   // "Korean TV drama" — countries/language as words
  genres: string[];
  director: string | null;
  cast: string[];               // top 3
  keywords: string[];
  overview: string | null;
};

export function composeMediaText(m: MediaTextInput): string {
  const parts = [
    `${m.title}${m.year ? ` (${m.year})` : ""}.`,
    m.originWords ? `${m.originWords}.` : "",
    m.genres.length ? `Genres: ${m.genres.join(", ")}.` : "",
    m.director ? `Directed by ${m.director}.` : "",
    m.cast.length ? `Starring ${m.cast.join(", ")}.` : "",
    m.keywords.length ? `Keywords: ${m.keywords.join(", ")}.` : "",
    m.overview ?? "",
  ];
  return parts.filter(Boolean).join(" ").trim();
}
```

(`MediaTextInput` lives here, not `types/` — it's module-internal plumbing, but
if lint/convention complains, move it to `types/ai.ts`.)

- [ ] **Step 1: Write the module** (above).
- [ ] **Step 2: Smoke-verify** — `npm i -D tsx` (not yet in devDeps), then a
throwaway `scripts/smoke-embed.ts`:

```ts
import { config } from "dotenv";
config({ path: ".env.local" });
const { embedQuery } = await import("../lib/embeddings");
const v = await embedQuery("cozy movie for a rainy night");
const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
console.log("dims:", v.length, "norm:", norm.toFixed(6));
```

Run: `npx tsx scripts/smoke-embed.ts`
Expected: `dims: 768 norm: 1.000000`. Delete the throwaway script after.

**Gotcha:** the `config()` call must run before importing `lib/embeddings`
(hence dynamic import) — `@ai-sdk/google` reads `GOOGLE_GENERATIVE_AI_API_KEY`
at call time, and plain `tsx` doesn't load `.env.local` (same reason
`drizzle.config.ts` uses dotenv).

- [ ] **Step 3: Commit** — `feat(ai): add embedding helpers (gemini-embedding-001, 768d)`

---

### Task 3: Seed script + retrieval smoke test

**Why:** Corpus before everything — taste vectors average corpus embeddings,
retrieval searches them. Idempotency is the design's crash-recovery: "skip ids
already embedded" makes re-run = resume = delta refresh, all the same code path.

**Files:** Create `scripts/seed-embeddings.ts`, `scripts/test-retrieval.ts`.
Add npm scripts: `"db:seed-embeddings": "tsx scripts/seed-embeddings.ts"`,
`"test:retrieval": "tsx scripts/test-retrieval.ts"`.

**Consumes:** `embedDocuments`, `composeMediaText` (Task 2); `mediaEmbeddings`,
`tmdbMedia` (Task 1).

**Script gotchas (apply to every `scripts/*.ts` here):** call
`config({ path: ".env.local" })` first, then **dynamically** import anything
that reads env at module load — `drizzle/index.ts` reads `DATABASE_URL` at
import time, and static imports hoist above the `config()` call. Use relative
imports (`../drizzle`, `../lib/embeddings`) rather than `@/` in scripts.

**Structure** (reference — write it in pieces, test each `console.log` as you go):

```ts
import { config } from "dotenv";
config({ path: ".env.local" });
import { gunzipSync } from "node:zlib";

const MOVIE_COUNT = 6000;
const TV_COUNT = 4000;
const TMDB = "https://api.themoviedb.org/3";
const headers = { Authorization: `Bearer ${process.env.TMDB_API_READ_KEY}` };

// 1. Download + parse export (published daily ~8:00 UTC; use yesterday's
//    date to avoid "today's file not published yet" 403s)
type ExportRow = { id: number; popularity: number; adult?: boolean };
async function fetchExport(kind: "movie" | "tv_series"): Promise<ExportRow[]> {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const url = `https://files.tmdb.org/p/exports/${kind}_ids_${mm}_${dd}_${d.getUTCFullYear()}.json.gz`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`export ${url}: ${res.status}`);
  const text = gunzipSync(Buffer.from(await res.arrayBuffer())).toString("utf8");
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ExportRow)
    .filter((r) => !r.adult)
    .sort((a, b) => b.popularity - a.popularity);
}

// 2. Hydrate one title (details + keywords + credits in ONE call)
//    movie: /movie/{id}?append_to_response=keywords,credits
//    tv:    /tv/{id}?append_to_response=keywords,credits
//    NOTE: keywords shape differs — movie: keywords.keywords[], tv: keywords.results[]
//    Director: movie = credits.crew.find(c => c.job === "Director")
//              tv    = created_by[0]?.name

// 3. Main loop, resumable:
//    - const done = new Set of (tmdbId, mediaType) already in media_embeddings
//    - candidates = top MOVIE_COUNT movies + top TV_COUNT tv, minus done
//    - process in chunks of 100:
//        a. hydrate chunk with concurrency ~20 (Promise.all over sub-chunks;
//           on 429 wait 2s and retry once; on 404 skip)
//        b. upsert tmdb_media rows (mirror the onConflictDoUpdate shape from
//           lib/tmdb-cache.ts getCachedMovieDetails — same columns, plus
//           detailsData so detail pages get the permanent-cache side effect)
//        c. composeMediaText per title; embedDocuments(texts) — the AI SDK
//           splits into API-sized batches itself; on rate-limit error wait
//           30s and retry the chunk
//        d. insert media_embeddings rows (embedding, originCountries from
//           details origin_country ?? [production country codes])
//        e. console.log(`${processed}/${total}`)
```

- [ ] **Step 1: Write export download + parse.** Verify standalone: log
`rows.length` (expect ~1M movies / ~200k tv) and the top-5 titles (expect
recognizable blockbusters).
- [ ] **Step 2: Write hydration for one movie + one tv id.** Verify: log
composed text for e.g. movie 27205 (Inception) — check genres, director
"Christopher Nolan", keywords present, then same for a tv id.
- [ ] **Step 3: Write main loop with resume-set + chunking.** Start it, let it
run ~2 chunks, Ctrl-C, re-run — verify it skips what's done (log the skip
count). Then let it run to completion (~20–40 min: hydration ~5 min, embedding
dominated by API rate limits).
- [ ] **Step 4: Verify corpus**

```bash
psql "$DATABASE_URL_DIRECT" -c "select media_type, count(*) from media_embeddings group by 1;"
```

Expected: ~6000 movie / ~4000 tv (a few hundred short is fine — 404s, missing
overviews).

- [ ] **Step 5: `scripts/test-retrieval.ts`** — the eyeball test. 15 fixed
queries → for each: `embedQuery` → top-10 via `cosineDistance` join
`tmdb_media` for titles → print. Queries: "cozy movie for a rainy night",
"mind-bending sci-fi that makes you think", "korean romance series",
"something like John Wick", "feel-good family animation", "dark gritty crime
drama", "time travel", "slow burn psychological thriller", "japanese anime
series", "movie about grief and healing", "space exploration epic", "light
comedy to watch with friends", "chinese historical drama", "zombie
apocalypse", "heist movie".

Run: `npm run test:retrieval`
Expected: eyeball-sane lists (korean query → K-content, John Wick → action
thrillers). If garbage → bug is almost always in `composeMediaText` (empty
overviews, missing keywords) — inspect a few stored rows.

- [ ] **Step 6: Commit** — `feat(ai): seed 10k-title embedding corpus from TMDB exports`

---

### Task 4: Taste vector

**Why:** Personalization half of the design. Stateless full rebuild per
recompute → weights tunable retroactively, no drift, no migration.

**Deviation from spec, on purpose:** spec said "one SQL statement". pgvector
has no vector-×-scalar SQL operator, so weighted math in SQL means ugly array
unpacking. Instead: fetch the user's vectors (≤ a few hundred rows), weighted
average in TypeScript, write back. Same result, ~10 ms, readable.

**Files:** Create `lib/taste-vector.ts`; modify `actions/watchlist.ts`.

**Produces:** `recomputeTasteVector(userId: string): Promise<void>`,
`TASTE_WEIGHTS` constants.

```ts
export const TASTE_WEIGHTS = {
  liked: 1.0,
  disliked: -0.5,
  watchedUnrated: 0.4,       // status watched/watching, rating null
  planToWatchUnrated: 0.15,
  recentMood: 0.2,           // × linear age decay over MOOD_WINDOW_DAYS
} as const;
export const MOOD_WINDOW_DAYS = 30;
export const MOOD_LIMIT = 5;
const MIN_NORM = 1e-6;
```

`recomputeTasteVector(userId)`:
1. Join user's `watchlist` rows × `mediaEmbeddings` on (tmdbId, mediaType) →
   `{ embedding, rating, status }[]`.
2. Fetch last `MOOD_LIMIT` `aiRecommendations` rows for user where
   `moodEmbedding is not null` and `createdAt > now − MOOD_WINDOW_DAYS`.
3. Weight per row: rating 1 → `liked`; rating −1 → `disliked`; else by status.
   Mood rows: `recentMood × (1 − ageDays / MOOD_WINDOW_DAYS)`.
4. `taste[i] = Σ (w × v[i]) / Σ |w|` (absolute in denominator — negative
   weights subtract direction but must not shrink the divisor).
5. `norm(taste) < MIN_NORM` or no rows → write `NULL`. Else write vector +
   `tasteUpdatedAt`.
6. Entire function wrapped so it **never throws** (log + return) — callers
   fire-and-forget.

Wiring in `actions/watchlist.ts`: after each successful add / remove /
updateStatus / rate mutation:

```ts
void recomputeTasteVector(user.id).catch(() => {});
```

(after the mutation's own await, before returning — same fire-and-forget
pattern as the cache upserts in `lib/tmdb-cache.ts`).

- [ ] **Step 1: Write `lib/taste-vector.ts`.**
- [ ] **Step 2: Wire the four mutations in `actions/watchlist.ts`.**
- [ ] **Step 3: Verify** — `npm run dev`, like 2–3 sci-fi titles in the UI, then:

```bash
psql "$DATABASE_URL_DIRECT" -c "select taste_updated_at, taste_vector is not null as has_taste from profiles;"
```

Expected: `has_taste = t`, fresh timestamp. Then dislike one of them —
timestamp advances. Remove all watchlist items → `has_taste = f` (NULL path).

- [ ] **Step 4: Commit** — `feat(ai): compute user taste vector from watchlist signals`

---

### Task 5: `lib/retrieval.ts` — catalog search

**Why:** The retrieval core, isolated from route plumbing so
`test-retrieval.ts`-style scripts and any future "For you" row reuse it.

**Files:** Create `lib/retrieval.ts`.

**Consumes:** `embedQuery` (Task 2), `mediaEmbeddings` (Task 1), `tmdbMedia`,
`watchlist`, `profiles`.

**Produces:**

```ts
export type CatalogCandidate = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  year: string | null;
  genres: string[];        // mapped from genreIds via lib/constants GENRES/TV_GENRES
  overview: string;        // truncated ~200 chars — 30 full overviews bloat the prompt
  voteAverage: number | null;
  posterPath: string | null;
  similarity: number;
};

export type CatalogSearchResult = {
  candidates: CatalogCandidate[];
  moodVec: number[];   // Task 6 stores this as mood_embedding — returning it
                       // avoids a second embed API call
};

export async function searchCatalog(params: {
  userId: string;
  moodQuery: string;
  mediaType?: "movie" | "tv";
  originCountry?: string;   // ISO 3166-1 alpha-2
  limit?: number;           // default 30
}): Promise<CatalogSearchResult>;
```

Implementation order inside:
1. `embedQuery(moodQuery)` → moodVec.
2. Read `profiles.tasteVector`; if non-null:
   `searchVec[i] = 0.75 * moodVec[i] + 0.25 * taste[i]`, else moodVec.
   Constants: `MOOD_BLEND = 0.75`, `TASTE_BLEND = 0.25` exported at top.
3. Fetch user's watchlist `tmdbId`s (one small query).
4. Drizzle query:

```ts
const similarity = sql<number>`1 - (${cosineDistance(mediaEmbeddings.embedding, searchVec)})`;
const rows = await db
  .select({ /* join columns from tmdbMedia + similarity */ })
  .from(mediaEmbeddings)
  .innerJoin(tmdbMedia, and(
    eq(tmdbMedia.tmdbId, mediaEmbeddings.tmdbId),
    eq(tmdbMedia.mediaType, mediaEmbeddings.mediaType),
  ))
  .where(and(
    params.mediaType ? eq(mediaEmbeddings.mediaType, params.mediaType) : undefined,
    params.originCountry
      ? sql`${mediaEmbeddings.originCountries} @> ARRAY[${params.originCountry}]::text[]`
      : undefined,
    watchlistIds.length
      ? notInArray(mediaEmbeddings.tmdbId, watchlistIds)
      : undefined,
  ))
  .orderBy((t) => desc(t.similarity))
  .limit(params.limit ?? 30);
```

5. **Empty-result retry (spec error table):** if `rows.length === 0` and
   `originCountry` was set, run once more without the country filter.
6. Map `genreIds` → names via `GENRES`/`TV_GENRES`, truncate overviews, return.

**Gotcha:** `and(...)` ignores `undefined` members — that's what makes the
conditional filters composable. Don't build the where-clause with string
concatenation.

- [ ] **Step 1: Write the module.**
- [ ] **Step 2: Verify with a throwaway tsx script** (dotenv first, like Task 2):
call `searchCatalog` with your real user id and
`{ moodQuery: "korean romance series", mediaType: "tv", originCountry: "KR" }` →
expect K-dramas, none from your watchlist; then `"heist movie"` with no
filters → heist films. `npm run build` + `npm run lint` pass.
- [ ] **Step 3: Commit** — `feat(ai): vector catalog search with taste blending`

---

### Task 6: AI route — retrieval tools + fallback

**Why:** Wires retrieval into the agentic loop. The candidate-set closure is
the hallucination guarantee: `present_recommendations` can only bless ids that
`recommend_titles` actually returned *in this request*.

**Files:** Modify `app/api/ai/recommend/route.ts`, `types/ai.ts`.

**Consumes:** `searchCatalog` (Task 5), `embedQuery` (Task 2).

**Produces (UI contract, Task 7 depends on the exact shape):** the
`present_recommendations` tool output:

```ts
// types/ai.ts
export type RecommendedTitle = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  year: string | null;
  posterPath: string | null;
  reason: string;
};
export type RecommendationsResult = {
  picks: RecommendedTitle[];   // hooks/use-ai.ts detects "picks" key
  moodSummary: string;
};
```

Changes in the route handler (inside `POST`, after auth/rate-limit — all
per-request state stays inside the handler scope):

1. **Per-request candidate closure**, above `streamText`:

```ts
let lastCandidates: CatalogCandidate[] = [];
```

2. **Tool `recommend_titles`:**

```ts
recommend_titles: tool({
  description:
    "Search the movie/TV catalog by mood or vibe. Distill the user's mood from the whole conversation into a rich descriptive query. Returns real candidate titles to choose from.",
  inputSchema: z.object({
    moodQuery: z.string().describe(
      "Descriptive search text distilled from the conversation, e.g. 'cozy heartwarming non-romance movie for a rainy night'",
    ),
    media_type: z.enum(["movie", "tv"]).optional(),
    origin_country: z.string().length(2).optional(),
    moodSummary: z.string().describe("Short summary of the user's mood"),
  }),
  execute: async (params) => {
    try {
      const { candidates, moodVec } = await searchCatalog({
        userId,
        moodQuery: params.moodQuery,
        mediaType: params.media_type,
        originCountry: params.origin_country,
      });
      if (candidates.length === 0) return { error: "retrieval_unavailable" as const };
      lastCandidates = candidates;

      // mood_embedding for the taste signal (fire-and-forget; moodVec comes
      // back from searchCatalog so no second embed call)
      db.insert(aiRecommendations)
        .values({
          userId,
          prompt: lastMessageText || "mood chat",
          recommendations: { moodSummary: params.moodSummary },
          moodEmbedding: moodVec,
        })
        .catch((e) => console.error("[AI] mood embedding insert:", e));

      return {
        candidates: candidates.map((c) => ({
          tmdbId: c.tmdbId, mediaType: c.mediaType, title: c.title,
          year: c.year, genres: c.genres, overview: c.overview,
          rating: c.voteAverage,
        })),
      };
    } catch (e) {
      console.error("[AI] retrieval failed:", e);
      return { error: "retrieval_unavailable" as const };
    }
  },
}),
```


3. **Tool `present_recommendations`:**

```ts
present_recommendations: tool({
  description:
    "Present your final 5-8 picks from the recommend_titles candidates, with a one-line personal reason for each.",
  inputSchema: z.object({
    picks: z.array(z.object({
      tmdbId: z.number(),
      reason: z.string().max(200),
    })).min(3).max(8),
    moodSummary: z.string(),
  }),
  execute: async (params) => {
    const byId = new Map(lastCandidates.map((c) => [c.tmdbId, c]));
    const picks = params.picks.flatMap(({ tmdbId, reason }) => {
      const c = byId.get(tmdbId);
      if (!c) return []; // hallucinated or stale id — dropped
      return [{ tmdbId: c.tmdbId, mediaType: c.mediaType, title: c.title,
                year: c.year, posterPath: c.posterPath, reason }];
    });
    if (picks.length < 3) return { error: "not_enough_valid_picks" as const };
    return { picks, moodSummary: params.moodSummary };
  },
}),
```

4. **System prompt additions** (keep everything existing; insert before
OFF-TOPIC section):

```
MOOD RECOMMENDATIONS (primary flow):
When you understand the user's mood, call recommend_titles. Write moodQuery as
a rich descriptive sentence distilled from the ENTIRE conversation, not the
raw last message. Then pick the 5-8 best candidates and call
present_recommendations with a short personal reason per pick (reference the
user's taste when relevant). Only pick tmdbIds returned by recommend_titles.
If recommend_titles returns an error, or you have fewer than 3 good
candidates, fall back to suggest_genres instead.
Use suggest_genres directly for plain genre requests ("just action movies").
```

5. **Step budget:** `stopWhen: stepCountIs(3)` → `stepCountIs(4)` (retrieve →
present → closing text; +1 headroom for a fallback hop).

- [ ] **Step 1: Add types to `types/ai.ts`.**
- [ ] **Step 2: Add tools + prompt + step bump to the route.**
- [ ] **Step 3: Verify streaming behavior** — `npm run dev`, send "something
cozy for a rainy night" in mood chat, watch the dev-server/network: expect a
`tool-recommend_titles` part then `tool-present_recommendations` with
`state: "output-available"` and a `picks` array in the response stream (UI
renders nothing yet — Task 7). Check `ai_recommendations` has a new row with
`mood_embedding is not null`.
- [ ] **Step 4: Verify fallbacks** — temporarily make `searchCatalog` throw
(`throw new Error("test")` first line): same query must produce a
`suggest_genres` flow (today's UX). Revert. Vague message ("idk") → clarifying
question, no tool call.
- [ ] **Step 5: Commit** — `feat(ai): agentic RAG tools in recommend route`

---

### Task 7: UI — recommendation cards

**Why:** The user-visible payoff. Mirrors the existing pattern exactly: hook
extracts a typed tool output from message parts; a card component renders it.
Look at how `shazam-card.tsx` consumes `identify_media` matches before writing
this — same shape of work.

**Files:** Modify `hooks/use-ai.ts`, `components/ai/mood-section.tsx`;
create `components/ai/recommendation-cards.tsx`.

**Consumes:** `RecommendationsResult` (`picks` key) from Task 6.

- [ ] **Step 1: Extraction in `hooks/use-ai.ts`** — third extractor alongside
the existing two (they discriminate by output shape: `matches` → identify,
`genres` → suggestion; this one keys on `picks`):

```ts
if ("picks" in output && Array.isArray(output.picks)) {
  return output as unknown as RecommendationsResult;
}
```

Return it from the hook as `recommendations` (same memo pattern as the
others; scan latest assistant message).

- [ ] **Step 2: `components/ai/recommendation-cards.tsx`** — client component,
props `{ result: RecommendationsResult }`. Per pick: poster
(`https://image.tmdb.org/t/p/w342${posterPath}`, fall back to
`/placeholder-poster.svg`), title + year, reason text, link to
`/movie/[id]` or `/tv/[id]` by `mediaType`. Reuse card styling/motion
conventions from `components/movies/movie-card.tsx` — don't invent a new
card language. Add-to-library via existing `use-watchlist.ts` hooks if the
existing card exposes that affordance cheaply; otherwise the detail-page link
suffices for v1.
- [ ] **Step 3: Render in `mood-section.tsx`** — where `shazam-card`/genre CTA
render today: if `recommendations` present, show `RecommendationCards`
(recommendations take precedence over the genre CTA when both appear).
- [ ] **Step 4: Verify** — dev server: "melancholic slow-burn sci-fi" → 5–8
cards, real posters, reasons mention taste when you've liked related titles;
click a card → detail page loads. `npm run build` + `npm run lint` pass.
- [ ] **Step 5: Commit** — `feat(ai): render RAG recommendation cards in mood chat`

---

### Task 8: Regression + QA evidence

**Why:** The system prompt grew and the tool set doubled — the flows most
likely to silently regress are the ones you didn't touch.

- [ ] **Step 1: Regression sweep (dev server, manual or Playwright):**

| Input | Must still happen |
|---|---|
| "the movie where the guy grows potatoes on Mars" | `identify_media` → shazam card, no recommend_titles |
| "idk, whatever" | one clarifying question, no tool call |
| "write my resume" | witty redirect (off-topic filter) |
| "just show me action movies" | `suggest_genres` → genre CTA/grid |
| 501-char message | 400 rejected |
| new account (empty watchlist) | recommendations still work (NULL-taste path) |

- [ ] **Step 2: Playwright QA with screenshot evidence** (per QA convention:
saved to repo root, untracked, `qa-*` naming):
`qa-rag-mood-cards.png` (cards rendered), `qa-rag-card-detail-nav.png`
(detail page after card click), `qa-rag-genre-fallback.png` (plain genre
request → old flow), `qa-rag-identify-regression.png` (shazam card). List
paths in the session report; DOM assertions alongside (cards count ≥3,
poster `src` non-placeholder, URL after nav).
- [ ] **Step 3: Docs** — CLAUDE.md: add `lib/embeddings.ts`, `lib/retrieval.ts`,
`lib/taste-vector.ts`, `scripts/seed-embeddings.ts` to Key Directories; note
`media_embeddings` table + seed command in the DB section.
- [ ] **Step 4: Commit** — `docs: document RAG recommendation pipeline`

---

## Order & dependencies

```
Task 1 (schema) ─→ Task 2 (embeddings lib) ─→ Task 3 (seed) ─→ Task 5 (retrieval) ─→ Task 6 (route) ─→ Task 7 (UI) ─→ Task 8 (QA)
                                    └────────→ Task 4 (taste) ──────┘
```

Task 4 only needs Tasks 1–3 (it averages corpus vectors) — do it before or
after Task 5, but before verifying personalization in Task 6.

## Tuning knobs (all constants, safe to tweak post-ship)

| Knob | Where | Default |
|---|---|---|
| Blend mood/taste | `lib/retrieval.ts` | 0.75 / 0.25 |
| Taste weights | `lib/taste-vector.ts` | see TASTE_WEIGHTS |
| Candidate count | `lib/retrieval.ts` | 30 |
| Picks range | route tool schema | 3–8 |
| Corpus size | seed script | 6k + 4k |
| Mood-signal window | `lib/taste-vector.ts` | 5 convos / 30 days |
