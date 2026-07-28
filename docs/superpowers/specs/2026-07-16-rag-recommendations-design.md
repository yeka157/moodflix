# RAG-Grounded AI Recommendations — Design

**Date:** 2026-07-16 (revised 2026-07-28)
**Status:** Approved
**Scope:** v1 — mood chat only

**2026-07-28 revision:** framework question settled (AI SDK v6 `ToolLoopAgent`,
no LangChain — see Decisions log). Added the four long-term schema hooks that
are cheap now and expensive later: embedding versioning, vector `kind`,
`recommendation_events`, `search_tsv`. Added the corpus expansion ladder and
explicit triggers for revisiting the framework call. Query flow, taste vector,
and error handling unchanged.

## Problem

The AI mood feature maps mood text to 1–3 TMDB genres, then shows generic
genre-discover results. Genre is a crude retrieval unit: "melancholic slow-burn
sci-fi like Arrival" collapses to Sci-Fi (878), and every user sees the same
popularity-sorted list. There is no personalization and the AI never recommends
specific titles for moods.

## Goal

Mood queries return 5–8 **specific, real, personalized titles** with a
one-line reason each, rendered as poster cards in the mood chat. Every
recommended title is guaranteed to exist in our catalog (retrieval-grounded —
hallucination structurally impossible).

## Non-goals (v1)

- Home page "For you" row (trivial to add later on same infra)
- Collaborative filtering / model training (requires user-scale we don't have)
- Separate backend service (Python/FastAPI) — see Decisions
- `top_hundred` as a taste signal (feature deferred)
- Automatic corpus refresh cron (manual delta re-run for v1)

## Decisions log

| Decision | Choice | Why |
|---|---|---|
| Vector store | pgvector in existing Supabase Postgres | Zero new infra; 10k vectors ≈ 30 MB; ANN in ms at this scale |
| Similarity metric | Cosine (`<=>`) | Self-normalizing — no unit-length invariant to maintain across write sites; taste vector (weighted average) is naturally non-unit; identical ranking to L2 on normalized vectors anyway |
| Embedding model | Gemini `gemini-embedding-001`, 768 dims (`outputDimensionality: 768`, re-normalize after MRL truncation) | Same API key already in use; 768 halves storage vs 1536 with negligible quality loss |
| Task types | `RETRIEVAL_DOCUMENT` for corpus, `RETRIEVAL_QUERY` for queries | Asymmetric pairing improves retrieval |
| Corpus | Top ~6k movies + ~4k TV by TMDB popularity | Covers what users ask for; <$1 one-time embedding cost; growable |
| Data source | TMDB daily ID export files + API hydration | Live data, free; Kaggle dumps stale with dead poster paths |
| RAG shape | Agentic (retrieval as tool) | Model distills full conversation into clean search query (biggest retrieval-quality lever); retrieval only when appropriate; clarify/off-topic/identify flows unaffected. Cost: 1 embed + 2–3 Gemini steps per query — negligible at 10 req/day/user rate limit |
| Orchestration | Vercel AI SDK **v6** `ToolLoopAgent` (installed: `ai@6.0.101`) | No LangChain/LangGraph/CrewAI. Framework RAG value sits in loaders + splitters + chunking strategy; this corpus needs none of it (one vector per title, no chunking — semantic search over structured records, not document RAG). AI SDK also owns the UIMessage stream protocol that `mood-section.tsx` already renders tool parts from — LangChain.js has no equivalent, so adopting it means hand-rolling the wire protocol for web *and* React Native. CrewAI is Python-only, which contradicts the no-Python-service decision below |
| Orchestrator escape hatch | Retrieval stays behind one boundary: `searchCatalog(query, filters, userId) → Candidate[]` | Framework choice becomes a one-file swap, so it does not need to be right today. Compare implementations empirically on the Task 3 smoke queries instead of arguing in the abstract |
| Embedding versioning | `embedding_model` + `dims` columns; unique index includes model | `gemini-embedding-001` will be superseded. Unversioned rows mean no dual-write, no way to identify stale vectors, and a hard cutover with search down. Two columns now vs a migration under pressure later |
| Vector granularity | `kind` column (`'summary'` for v1) | Lets plot / vibe / review / poster-image vectors coexist per title later without a table rewrite and without rewriting every retrieval query |
| Outcome logging | `recommendation_events` table, written from day one | The one asset that **cannot be backfilled**. It is the training set for a learned reranker, collaborative filtering, the eval suite, and blend-weight tuning. Everything else on the roadmap is retrofittable; twelve months of user behavior is not |
| Lexical headroom | `search_tsv` generated column on `tmdb_media` now; RRF fusion wired when misses show up | Pure vector fails exact lookups ("Tilda Swinton films", a literal title). Postgres does BM25 + pgvector in one query — this is precisely what people adopt LangChain retrievers for, and it is ~40 lines of SQL we own |
| Runtime | This repo, Next.js route | No Python service: pipeline is pure I/O (verified — every runtime path is DB/HTTP; only CPU is web-push crypto, microseconds). Postgres is the data contract, so a future Python training worker can read the same tables without reworking v1 |
| Durable/async execution | Vercel Workflow / Queues when needed — not an orchestrator concern | Nightly digests and multi-minute agent runs need durable retries, which AI SDK (request-scoped) does not provide. That is a platform capability on this stack, not a reason to adopt LangGraph, whose checkpointing targets multi-hour human-in-loop graphs |

## Architecture

```
user mood text
  → Gemini (existing chat loop, /api/ai/recommend)
  → tool: recommend_titles(moodQuery, mediaType?, originCountry?)
      1. embed(moodQuery, RETRIEVAL_QUERY)
      2. searchVec = 0.75·moodVec + 0.25·tasteVec   (skip blend if taste NULL)
      3. pgvector cosine top-30; filter media_type/origin_country;
         exclude user's watchlist tmdbIds
      4. return candidates (title, year, genres, overview snippet,
         vote_average, tmdbId, posterPath)
  → Gemini picks 5–8, writes one-line reason each
  → tool: present_recommendations({ picks: [{tmdbId, reason}] })
      validates every tmdbId ∈ candidate set; drops invalid; enriches
  → UI renders poster cards from tool part (same pattern as identify_media)
```

`suggest_genres` remains for generic requests and as fallback path.
`identify_media` unchanged. Auth, rate limiting, input limits, off-topic
filter unchanged.

## Schema changes

**New table `media_embeddings`** (append to end of `drizzle/schema.ts`):

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | defaultRandom |
| tmdb_id | integer | part of unique key |
| media_type | media_type enum | mirrors tmdb_media |
| kind | text NOT NULL DEFAULT `'summary'` | vector granularity — `summary` for v1; `plot` / `review` / `poster` later |
| embedding_model | text NOT NULL | e.g. `gemini-embedding-001` — enables dual-write during a model migration |
| dims | smallint NOT NULL | 768 for v1; guards against dimension drift |
| embedding | vector(768) | pgvector |
| origin_countries | text[] | denormalized from TMDB details so retrieval filters country without a JSONB probe |
| embedded_at | timestamp | |

- Unique on `(tmdb_id, media_type, kind, embedding_model)` — **not** `(tmdb_id, media_type)`. The wider key is what makes both multi-vector-per-title and staged model migration possible.
- All retrieval queries filter `kind` and `embedding_model` explicitly. Both live in one constants object next to the model id.
- HNSW index with `vector_cosine_ops`.
- Separate table (not a column on `tmdb_media`): `tmdb_media` fills lazily via
  cache without embeddings; separate table keeps "what is searchable" explicit
  and avoids nullable-vector/partial-index complexity.
- Migration requires `CREATE EXTENSION IF NOT EXISTS vector;` (one-time).
- Drizzle: `vector({ dimensions: 768 })` native type.

**`profiles`**: add `taste_vector vector(768)` (nullable),
`taste_updated_at timestamp` (nullable).

**`ai_recommendations`**: add `mood_embedding vector(768)` (nullable) —
written fire-and-forget when a recommendation fires; powers the short-term
conversation-history signal without re-embedding old text.

**New table `recommendation_events`** — append-only, fire-and-forget, written
from `present_recommendations`. This is the irreplaceable one: `mood_embedding`
records *what was asked*, this records *what was retrieved, what was chosen, and
whether the user acted*.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → profiles | cascade delete |
| distilled_query | text | the model-written search query, not the raw mood text |
| mood_embedding | vector(768) | the actual search vector used (post-blend) |
| candidate_tmdb_ids | integer[] | the top-30 offered to the model |
| picks | jsonb | `[{ tmdbId, mediaType, reason, rank }]` |
| embedding_model, prompt_version | text | so results stay attributable after either changes |
| fallback_reason | text nullable | null on the happy path; else `retrieval_unavailable` / `zero_candidates` / `invalid_picks` |
| latency_ms | integer | retrieval segment only |
| created_at | timestamp | |

Attribution is joined after the fact — no extra columns needed on this table.
A recommended `tmdb_id` later appearing in `watchlist` for the same user, or a
detail-page visit, is the implicit label. What matters is that the *candidate
set and the picks* are on disk; behavior can be joined to them at any time,
but it can never be reconstructed if they were not recorded.

**`tmdb_media`**: add a generated `search_tsv tsvector` column (from
`title`+`overview`) with a GIN index. Unused in v1 — added in the same
migration so hybrid RRF fusion is later a query change, not a migration.

**RLS**: enable on `media_embeddings` with zero policies (server-only access
via Drizzle owner connection). Append to `drizzle/rls-policies.sql` and apply
manually in Supabase SQL Editor, per project convention.

## Seed pipeline

`scripts/seed-embeddings.ts`, run locally via `tsx`, uses
`DATABASE_URL_DIRECT`.

1. Download today's `movie_ids_*.json.gz` + `tv_series_ids_*.json.gz` from
   `files.tmdb.org/p/exports/` (no auth). Parse JSONL, drop `adult: true`,
   sort by popularity desc, take top ~6k movies + ~4k TV.
2. Hydrate each via existing TMDB client with `append_to_response=keywords`
   (~5 min at 40 req/s). Upsert into `tmdb_media` (same shape as
   `lib/tmdb-cache.ts` writes) — side effect: 10k detail pages permanently
   cached.
3. Compose embedding text per title:
   `"{title} ({year}). {origin-language/country as words, e.g. "Korean TV
   drama"}. Genres: {genres}. Directed by {director}. Starring {top 3 cast}.
   Keywords: {keywords}. {overview}"`
   Numeric fields (rating, popularity, runtime) stay out — they embed poorly;
   kept as columns for rerank instead.
4. Embed via AI SDK `embedMany` (auto-batching), `RETRIEVAL_DOCUMENT`,
   768 dims, re-normalize. Insert into `media_embeddings`.
5. Idempotent: skips already-embedded ids → re-run = delta refresh for new
   releases (~$0.02 per refresh). Manual for v1.

Cost: <$1 one-time (≈2–3M tokens at ~$0.15/1M, verify current pricing at
implementation).

## Taste vector

Weighted average of embeddings of the user's items, stored in
`profiles.taste_vector`:

| Signal | Weight |
|---|---|
| Watchlist rating = like (1) | +1.0 |
| Watchlist rating = dislike (−1) | −0.5 (dislikes are noisier) |
| Watched/watching, unrated | +0.4 |
| Plan-to-watch, unrated | +0.15 |
| Recent `mood_embedding`s (last 5 convos, <30 days) | +0.2 × linear age decay |

- Weights in one constants object. Recompute is **stateless** (full rebuild
  from raw data) → weight changes apply retroactively, no migration.
- Compute: single SQL statement (join `watchlist` × `media_embeddings`,
  weighted sum / total weight), ~10 ms. Written fire-and-forget after every
  rating/status mutation in `actions/watchlist.ts`.
- Zero API calls (averages stored vectors).
- Cold start: no signals or `norm < ε` → NULL → personalization skipped.
- Query time always excludes the user's own watchlist ids from results.

## Query flow parameters

- Blend: `searchVec = 0.75 × moodVec + 0.25 × tasteVec` — mood dominates,
  taste breaks ties. Constants, tunable.
- Candidate count: 30 to Gemini; 5–8 presented.
- Retrieval latency budget: ~100 ms added (embed ~50 ms + SQL ~5 ms) inside
  existing streaming — invisible.

## Error handling

Every failure degrades to today's genre-grid behavior; chat never breaks.

| Failure | Handling |
|---|---|
| Embed API error/timeout in tool | Tool returns `{ error: "retrieval_unavailable" }`; system prompt directs Gemini to fall back to `suggest_genres` |
| pgvector query error | Same fallback |
| 0 candidates (over-filtered) | Retry once without origin_country filter; still 0 → genre fallback |
| Invalid tmdbId in picks | Dropped at validation; <3 valid picks → genre fallback |
| Taste NULL / near-zero | Not an error — pure mood vector (new-user path) |
| Taste recompute failure | Logged; stale vector persists; next mutation retries |
| Seed crash mid-run | Idempotent; re-run continues |

## Testing

1. **Retrieval smoke script** (post-seed): ~15 fixed queries ("cozy rainy
   night", "mind-bending sci-fi", "korean romance series", "something like
   John Wick") → assert sane genres/countries in top-30, print top-10 for
   review. Catches embedding-text composition bugs.
2. **Unit**: taste weight math against seeded test rows; pick validation
   (including hallucinated id); blend and NULL-taste paths.
3. **E2E (Playwright, with screenshot evidence per QA convention)**: mood
   query → cards render with real posters → click → detail page → add to
   library.
4. **Regression**: `identify_media`, off-topic redirect, vague-mood clarifying
   question still work after system prompt changes.

## Future path (explicitly out of scope, enabled by this design)

- Home "For you" row: pure pgvector query against taste vector, no AI call.
- Corpus refresh cron (Vercel Cron, delta embed).
- Group / watch-party recommendations: blend N taste vectors, penalize any
  member's dislikes. Pure SQL.
- Hybrid RRF fusion over `search_tsv` + `embedding` for exact title/person
  lookups.
- Multi-query fan-out (embed 2–3 query variants, union candidates) — recall
  bump for vague moods, ~$0.00001 and ~50 ms. Cheapest quality win post-v1.
- Learned reranker trained on `recommendation_events`.
- Collaborative filtering: a separate Python training worker that writes
  better vectors into the same Postgres tables — API layer and retrieval
  query unchanged.
- Agent write actions ("add all 6 to my library") — AI SDK v6 tool approval.
- MCP server exposing the user's library to external assistants.

### Corpus expansion ladder (cheapest value first)

| Source | Cost | Legal | What it unlocks |
|---|---|---|---|
| TMDB `keywords` | free — already in Task 3's `append_to_response` | ✅ | vibe/theme precision |
| TMDB `reviews` | free — one more append value | ✅ | user-prose vibe signal; short enough to need no chunking |
| Wikipedia plot sections | ~2 days, ~3 chunks/title → ~30k vectors | ✅ CC BY-SA | **"the movie where X happens"** — the real payoff for plot-event queries |
| Subtitles / scene-level | weeks; gated on acquisition (TMDB does not serve them; OpenSubtitles = account + per-release matching + variable quality) and on copyright review; ~1M vectors (~3 GB, slow HNSW build) | ⚠️ unresolved | exact-dialogue lookup only — narrow gain over Wikipedia plots |

Deliberate call: **Wikipedia plots, not subtitles.** ~80% of the "movie where
X happens" value for ~5% of the work and zero legal exposure. Subtitles stay
parked unless exact-dialogue search becomes a named product requirement.

### When to revisit the no-framework decision

Only these, and each is a corpus decision rather than a taste one:

- **Subtitle/scene RAG becomes firm** — real chunking, windowing, timestamp
  metadata and parent-document retrieval. LangChain's splitters would earn
  their keep there and should not be hand-rolled. Note Wikipedia plots do
  *not* trigger this: fixed section boundaries, ~3 chunks per title.
- **Multi-store retrieval** — a second corpus in a different vector store.
- **Durable async agent runs** → Vercel Workflow / Queues, not LangGraph.
