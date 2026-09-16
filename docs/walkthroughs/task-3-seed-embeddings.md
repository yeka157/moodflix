# Walkthrough — RAG Task 3: Seed the embedding corpus

**Status:** not started. Tasks 1 (schema) and 2 (`lib/embeddings.ts`) are done and
verified against the live DB.
**Plan:** `docs/superpowers/plans/2026-07-16-rag-recommendations.md` § Task 3
**Spec:** `docs/superpowers/specs/2026-07-16-rag-recommendations-design.md`
**Untracked on purpose** — scratch guide, delete when Task 3 lands.

---

## 0. What you are building

Two scripts:

| File | Purpose |
|---|---|
| `scripts/seed-embeddings.mts` | Fill `media_embeddings` with ~6000 movies + ~4000 TV titles. Resumable. |
| `scripts/test-retrieval.mts` | Eyeball test — 15 fixed queries, top-10 titles each. |

Two npm scripts:

```jsonc
"db:seed-embeddings": "tsx scripts/seed-embeddings.mts",
"test:retrieval": "tsx scripts/test-retrieval.mts"
```

**Done means:** `select media_type, count(*) from media_embeddings group by 1;`
returns ~6000 movie / ~4000 tv, and the retrieval test prints sane lists
(korean query → K-content, "something like John Wick" → action thrillers).

Everything downstream (Task 4 taste vector, Task 5 retrieval, Task 6 route)
reads this table. Nothing else blocks on anything else.

---

## 1. Preconditions — already true, don't redo

Verified against the live DB on 2026-09-03:

- `vector` extension enabled, 13 migrations applied
- `media_embeddings` exists (0 rows), HNSW cosine index + 4-col unique index present
- `tsx@^4.23.1` in devDependencies
- `GOOGLE_GENERATIVE_AI_API_KEY` and `TMDB_API_READ_KEY` in `.env.local`

Nothing to set up. Start writing.

---

## 2. Script skeleton rules (both scripts)

**Use `.mts`, never `.ts`.** `package.json` has no `"type": "module"`, so tsx
compiles `.ts` as CJS and top-level `await` dies with
`Top-level await is currently not supported with the "cjs" output format`.

**dotenv first, then dynamic import.** `drizzle/index.ts` reads `DATABASE_URL`
at module load and `@ai-sdk/google` reads its key at call time; static imports
hoist above `config()`.

```ts
import { config } from "dotenv";
config({ path: ".env.local" });

// Optional but recommended for a 30-minute batch: run through the session
// pooler (5432) instead of the transaction pooler (6543).
process.env.DATABASE_URL = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;

const { db } = await import("../drizzle");
const { mediaEmbeddings, tmdbMedia } = await import("../drizzle/schema");
const { embedDocuments, composeMediaText, EMBEDDING_MODEL, EMBEDDING_DIMS, VECTOR_KIND } =
  await import("../lib/embeddings");
```

**Relative imports (`../drizzle`), not `@/`** — scripts run outside the Next.js
path alias.

**Never inline `"gemini-embedding-001"`, `768`, or `"summary"`.** Import the
three constants. They are the identity triple stamped on every row and filtered
on every read; a literal that drifts silently mixes incomparable vectors.

---

## 3. Step 1 — Download + parse the TMDB daily export

TMDB publishes gzipped JSONL id dumps daily around 08:00 UTC. **Use yesterday's
date** — today's file 403s until it's published.

```
https://files.tmdb.org/p/exports/movie_ids_MM_DD_YYYY.json.gz
https://files.tmdb.org/p/exports/tv_series_ids_MM_DD_YYYY.json.gz
```

No auth header needed on these (they're static files, not the API).

```ts
type ExportRow = { id: number; popularity: number; adult?: boolean };
```

Pipeline: `fetch` → `gunzipSync(Buffer.from(await res.arrayBuffer()))` →
split `\n` → drop empties → `JSON.parse` per line → filter `!adult` → sort
`popularity` desc.

**Verify before moving on:**

```
console.log(rows.length, rows.slice(0, 5).map(r => r.id));
```

Expect ~1M movie rows / ~200k tv rows, and top-5 that are recognizable
blockbusters once hydrated. If the fetch 403s, you used today's date.

Take `rows.slice(0, 6000)` for movies, `rows.slice(0, 4000)` for tv.

---

## 4. Step 2 — Hydrate one title

One API call per title gets everything:

```
GET /movie/{id}?append_to_response=keywords,credits
GET /tv/{id}?append_to_response=keywords,credits
```

Auth: `Authorization: Bearer ${process.env.TMDB_API_READ_KEY}` — the v4 read
token, **not** an `api_key` query param.

Do NOT reuse `lib/tmdb.ts` helpers here: they append
`watch/providers,release_dates` (payload you don't need) and carry
`next: { revalidate }` cache options that mean nothing outside a request scope.
Write a plain `fetch` in the script.

### Shape differences that will bite you

| Field | Movie | TV |
|---|---|---|
| Title | `title` | `name` |
| Date | `release_date` | `first_air_date` |
| Keywords | `keywords.keywords[]` | `keywords.results[]` |
| Director | `credits.crew.find(c => c.job === "Director")?.name` | `created_by[0]?.name` |
| Origin | `origin_country[]` (often empty) → fall back to `production_countries[].iso_3166_1` | `origin_country[]` (reliable) |
| Runtime/seasons | `runtime` | `number_of_seasons` |

### Mapping into `MediaTextInput` (`types/ai.ts`)

```ts
{
  title, year: date?.slice(0, 4) ?? null,
  originWords,                       // see below
  genres: details.genres.map(g => g.name),   // details give names, not ids — no GENRES lookup needed
  director,
  cast: credits.cast.slice(0, 3).map(c => c.name),
  keywords: kw.slice(0, 12).map(k => k.name),
  overview: details.overview || null,
}
```

`originWords` is the "Korean TV drama" phrase. Build it from
`COUNTRY_LABELS` in `lib/constants.ts` (adjective map — `KR → "Korean"`),
falling back to `new Intl.DisplayNames(["en"], { type: "region" }).of(code)`
for codes not in the map, then append `"TV series"` / `"film"` by media type.
Return `null` when there's no country — `composeMediaText` drops empty parts on
purpose, and emitting `"undefined."` poisons every sparse title toward
similarity with every other sparse title.

**Skip a title entirely when `overview` is empty.** A title-only vector is
noise that will surface in unrelated queries.

**Verify before moving on:** hydrate movie `27205` (Inception) and any tv id,
`console.log(composeMediaText(input))` for each. Expect genres, "Directed by
Christopher Nolan", real keywords, full overview in one readable sentence run.
This one printout is the highest-signal check in the whole task — if the text
is wrong here, the corpus is wrong and you won't find out for 40 minutes.

---

## 5. Step 3 — The main loop

### Resume set (this is the crash recovery, the delta refresh, and the re-run — all one code path)

```ts
const done = new Set<string>();          // `${tmdbId}:${mediaType}`
// SELECT tmdb_id, media_type FROM media_embeddings
//   WHERE kind = VECTOR_KIND AND embedding_model = EMBEDDING_MODEL
```

**Scope the query to `kind` + `embedding_model`.** Without it a future model
migration sees old-generation rows as "done" and silently skips re-embedding
the entire corpus.

`candidates = (top 6000 movies + top 4000 tv) − done`, processed in chunks of 100.

### Per chunk

1. **Hydrate** with concurrency ~20 (`Promise.all` over sub-chunks of 20).
   On 429: wait 2s, retry once. On 404: skip the title (dead ids are normal in
   the export). TMDB tolerates ~50 req/s, so 20 is comfortable.
2. **Upsert `tmdb_media`** — mirror the exact shape in `lib/tmdb-cache.ts`
   (`getCachedMovieDetails`, around line 167), including `detailsData` and
   `detailsFetchedAt`, so detail pages get a warm permanent cache as a side
   effect of seeding:
   ```ts
   .onConflictDoUpdate({ target: [tmdbMedia.tmdbId, tmdbMedia.mediaType], set: { ... } })
   ```
   Note `voteAverage` and `popularity` are `text` columns — `String(n)`, on
   purpose (float precision).
3. **Embed** — `composeMediaText` per title, then one `embedDocuments(texts)`
   call for the chunk. `embedMany` splits into API-sized batches itself; don't
   hand-batch. On a rate-limit error: wait 30s, retry the chunk once.
4. **Insert `media_embeddings`** — one row per title:
   ```ts
   { tmdbId, mediaType, kind: VECTOR_KIND, embeddingModel: EMBEDDING_MODEL,
     dims: EMBEDDING_DIMS, embedding, originCountries }
   ```
   `.onConflictDoNothing()` on the 4-column unique index. That plus the resume
   set is what makes re-running safe.
5. `console.log(\`${processed}/${total}\`)` — you will want this at minute 25.

### Ordering note

Embed *after* the `tmdb_media` upsert succeeds for the chunk. If the process
dies mid-chunk you want the cheap row present and the expensive vector absent,
never the reverse — the resume set keys off `media_embeddings`, so a vector
without its metadata row is invisible to the retry.

**Verify resume works before the full run:** start it, let ~2 chunks finish,
Ctrl-C, re-run. The skip count logged at startup must be ≥200. Only then let it
run to completion (~20–40 min; hydration ~5 min, the rest is embedding API
throughput).

**Cost/limits sanity check:** ~10k documents × ~150 tokens ≈ 1.5M input tokens.
Cents-scale on paid tier, but confirm your current key's tier and
requests-per-minute limit in AI Studio before kicking off the full run — a
free-tier RPM cap is what turns 30 minutes into 6 hours.

---

## 6. Step 4 — Verify the corpus

```bash
psql "$DATABASE_URL_DIRECT" -c \
  "select media_type, count(*) from media_embeddings group by 1;"
```

Expect ~6000 movie / ~4000 tv. A few hundred short is fine and expected — 404s
and empty overviews. Thousands short means the skip condition is too aggressive.

Also worth one look:

```sql
select tmdb_id, media_type, dims, embedding_model, kind, origin_countries
from media_embeddings limit 5;
```

Every row must show `dims = 768`, `kind = 'summary'`, the model id. If any row
disagrees, a literal leaked in somewhere instead of the imported constant.

---

## 7. Step 5 — `scripts/test-retrieval.mts`

For each of 15 fixed queries: `embedQuery(q)` → top-10 by `cosineDistance`
against `media_embeddings`, joined to `tmdb_media` for titles → print.

```ts
import { cosineDistance, sql, eq, and } from "drizzle-orm";
// similarity = sql`1 - (${cosineDistance(mediaEmbeddings.embedding, queryVec)})`
// filter: kind = VECTOR_KIND and embedding_model = EMBEDDING_MODEL
// order by similarity desc, limit 10
```

Queries: cozy movie for a rainy night / mind-bending sci-fi that makes you
think / korean romance series / something like John Wick / feel-good family
animation / dark gritty crime drama / time travel / slow burn psychological
thriller / japanese anime series / movie about grief and healing / space
exploration epic / light comedy to watch with friends / chinese historical
drama / zombie apocalypse / heist movie.

**Reading the output:** judge *rank order*, not absolute scores. Gemini cosine
scores cluster tightly (~0.57–0.59 even for unrelated pairs) — measured during
Task 2. Never gate on an absolute threshold anywhere in this pipeline; take
top-N and let the LLM rerank stage in Task 6 enforce relevance.

If results are garbage, the bug is almost always in `composeMediaText` inputs
(empty overviews, missing keywords) — pull a few rows' `details_data` from
`tmdb_media` and re-compose by hand before touching retrieval logic.

---

## 8. Step 6 — Commit

```
feat(ai): seed 10k-title embedding corpus from TMDB exports
```

Commits straight to `main` per repo convention. Two npm scripts + two `.mts`
files; no schema change, no migration.

---

## Gotcha checklist

| Gotcha | Symptom |
|---|---|
| `.ts` instead of `.mts` | `Top-level await is currently not supported with the "cjs" output format` |
| Static import above `config()` | `DATABASE_URL` undefined / Gemini 401 |
| Today's export date | 403 on `files.tmdb.org` |
| `keywords.keywords` used for TV | Zero keywords on every TV title, silently |
| `title` used for TV | `undefined` in composed text |
| Resume set not scoped to kind+model | Future model migration skips the whole corpus |
| Inlined `768` / model id | Rows that no query will ever match |
| Absolute similarity threshold | Empty result sets — scores cluster ~0.58 |
| Empty overview not skipped | Junk titles surfacing in unrelated queries |

## Tuning knobs

| Knob | Default | Where |
|---|---|---|
| Corpus size | 6000 movie / 4000 tv | seed script constants |
| Chunk size | 100 | seed script |
| Hydration concurrency | 20 | seed script |
| Keywords per title | 12 | hydration mapping |
| Cast per title | 3 | `MediaTextInput.cast` |

---

## After Task 3

Task 4 (taste vector) and Task 5 (retrieval lib) both unblock immediately and
are independent of each other. Task 4 averages corpus vectors from watchlist
signals; Task 5 is the search function Task 6's tools call.
