# RAG-Grounded AI Recommendations — Design

**Date:** 2026-07-16
**Status:** Approved (pending spec review)
**Scope:** v1 — mood chat only

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
| Orchestration | Vercel AI SDK v5 (existing) | No LangChain — one wrapper is enough; RAG here is one embed call + one SQL query |
| Runtime | This repo, Next.js route | No Python service: pipeline is pure I/O; Postgres is the data contract, so a future Python training worker can read the same tables without reworking v1 |

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
| tmdb_id | integer | unique together with media_type |
| media_type | media_type enum | mirrors tmdb_media |
| embedding | vector(768) | pgvector |
| embedded_at | timestamp | |

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
- Collaborative filtering: a separate Python training worker that writes
  better vectors into the same Postgres tables — API layer and retrieval
  query unchanged.
