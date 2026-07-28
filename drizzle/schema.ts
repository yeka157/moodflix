import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  unique,
  uniqueIndex,
  index,
  smallint,
  vector,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const watchlistStatusEnum = pgEnum("watchlist_status", [
  "want_to_watch",
  "watched",
]);

// NEW: shared media type enum (exported for drizzle-kit bug #5174)
export const mediaTypeEnum = pgEnum("media_type", ["movie", "tv"]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // references auth.users
  username: text("username").unique(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  // Weighted average of the user's item embeddings. NULL = cold start, which
  // is not an error: retrieval falls back to the pure mood vector. Recompute
  // is stateless (full rebuild from watchlist), so weight changes apply
  // retroactively without a migration.
  tasteVector: vector("taste_vector", { dimensions: 768 }),
  tasteUpdatedAt: timestamp("taste_updated_at", { withTimezone: true }),
});

export const watchlist = pgTable(
  "watchlist",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    tmdbId: integer("tmdb_id").notNull(),
    title: text("title").notNull(),
    posterPath: text("poster_path"),
    status: watchlistStatusEnum("status").default("want_to_watch"),
    rating: integer("rating"),
    // NEW: mediaType with default for backfill of existing rows
    mediaType: mediaTypeEnum("media_type").notNull().default("movie"),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow(),
    watchedAt: timestamp("watched_at", { withTimezone: true }),
  },
  (table) => [
    // Updated: now includes mediaType so movie+TV with same TMDB ID can coexist
    unique("watchlist_user_tmdb_media_unique").on(
      table.userId,
      table.tmdbId,
      table.mediaType
    ),
    index("watchlist_user_id_idx").on(table.userId),
  ]
);

export const aiRecommendations = pgTable(
  "ai_recommendations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    recommendations: jsonb("recommendations").notNull(),
    // Written fire-and-forget when a recommendation fires. Powers the
    // short-term conversation-history signal in the taste vector without
    // re-embedding old prompt text.
    moodEmbedding: vector("mood_embedding", { dimensions: 768 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("ai_recommendations_user_id_idx").on(table.userId)]
);

// NEW: ai_conversations for analytics logging (fire-and-forget, backend only)
export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    conversationId: text("conversation_id"),
    messages: jsonb("messages").notNull(),
    prompt: text("prompt"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    metadata: jsonb("metadata"),
  },
  (table) => [
    uniqueIndex("ai_conversations_conversation_id_unique")
      .on(table.conversationId)
      .where(sql`${table.conversationId} IS NOT NULL`),
  ]
);

// TMDB cache: category list responses (trending, popular, etc.) with 24h TTL
export const tmdbCache = pgTable("tmdb_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  category: text("category").notNull(),
  mediaType: mediaTypeEnum("media_type").notNull(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// TMDB media: individual movie/TV details (permanent cache)
//
// SCHEMA-INVISIBLE COLUMN: the DB also has a generated `search_tsv tsvector`
// (from title+overview, GIN-indexed), added as raw SQL in migration 0011. It
// is deliberately NOT declared here — Drizzle 0.45 has no native tsvector type
// and expressing it needs `customType`, which is more machinery than a column
// no code reads yet. It exists so hybrid BM25+vector RRF fusion is later a
// query change rather than a migration.
// ⚠️ Because it is invisible to Drizzle, `db:generate` will try to emit
// `DROP COLUMN search_tsv`. Check generated SQL for that before applying any
// future migration.
export const tmdbMedia = pgTable(
  "tmdb_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tmdbId: integer("tmdb_id").notNull(),
    mediaType: mediaTypeEnum("media_type").notNull(),
    title: text("title").notNull(),
    overview: text("overview"),
    posterPath: text("poster_path"),
    backdropPath: text("backdrop_path"),
    releaseDate: text("release_date"),
    voteAverage: text("vote_average"),
    voteCount: integer("vote_count"),
    genreIds: jsonb("genre_ids"),
    popularity: text("popularity"),
    runtime: integer("runtime"),
    numberOfSeasons: integer("number_of_seasons"),
    detailsData: jsonb("details_data"),
    ratingsUpdatedAt: timestamp("ratings_updated_at", { withTimezone: true }),
    detailsFetchedAt: timestamp("details_fetched_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("tmdb_media_tmdb_media_unique").on(table.tmdbId, table.mediaType),
    index("tmdb_media_tmdb_id_idx").on(table.tmdbId),
  ]
);

// NEW: top_hundred for My Top 100 feature (dense integer rank 1-100)
export const topHundred = pgTable(
  "top_hundred",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    tmdbId: integer("tmdb_id").notNull(),
    mediaType: mediaTypeEnum("media_type").notNull(),
    rank: integer("rank").notNull(),
    title: text("title").notNull(),
    posterPath: text("poster_path"),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("top_hundred_user_rank_unique").on(table.userId, table.rank),
    unique("top_hundred_user_tmdb_media_unique").on(
      table.userId,
      table.tmdbId,
      table.mediaType
    ),
  ]
);

// Push notification subscriptions (one per device per user)
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Notification subscriptions (user wants to be notified about a specific movie/TV release)
export const notificationSubscriptions = pgTable(
  "notification_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    tmdbId: integer("tmdb_id").notNull(),
    title: text("title").notNull(),
    posterPath: text("poster_path"),
    releaseDate: text("release_date"),
    lastNotifiedAt: timestamp("last_notified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("notification_subs_user_tmdb_unique").on(table.userId, table.tmdbId),
    index("notification_subs_user_id_idx").on(table.userId),
  ]
);

export const notificationTypeEnum = pgEnum("notification_type", [
  "release",
  "ai_event",
  "system",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull().default("release"),
    title: text("title").notNull(),
    body: text("body"),
    posterPath: text("poster_path"),
    href: text("href"),
    tmdbId: integer("tmdb_id"),
    mediaType: text("media_type"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("notifications_user_unread_partial_idx")
      .on(t.userId, t.createdAt.desc())
      .where(sql`${t.readAt} IS NULL`),
    index("notifications_user_created_idx").on(t.userId, t.createdAt.desc()),
  ],
);

// Vector catalog for RAG-grounded recommendations.
// Spec: docs/superpowers/specs/2026-07-16-rag-recommendations-design.md
//
// Separate table rather than a column on tmdb_media: tmdb_media fills lazily
// via cache without embeddings, so keeping "what is searchable" explicit avoids
// nullable-vector and partial-index complexity.
export const mediaEmbeddings = pgTable(
  "media_embeddings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tmdbId: integer("tmdb_id").notNull(),
    mediaType: mediaTypeEnum("media_type").notNull(),
    // Vector granularity. 'summary' = one vector per title (v1). Later:
    // 'plot' (Wikipedia sections), 'review', 'poster'. Present from day one so
    // multi-vector-per-title never needs a table rewrite.
    kind: text("kind").notNull().default("summary"),
    // Which model produced this vector. gemini-embedding-001 will eventually be
    // superseded; this lets a migration dual-write both generations and cut over
    // per-query instead of truncating and taking search down.
    embeddingModel: text("embedding_model").notNull(),
    dims: smallint("dims").notNull(),
    embedding: vector("embedding", { dimensions: 768 }).notNull(),
    // Denormalized from TMDB details so retrieval filters country without a
    // JSONB probe into details_data->'origin_country'.
    originCountries: text("origin_countries").array(),
    embeddedAt: timestamp("embedded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // kind + embeddingModel are part of the key ON PURPOSE. A narrow
    // (tmdbId, mediaType) unique would block both multi-vector-per-title and
    // staged model migration, and widening it later means a table rewrite.
    uniqueIndex("media_embeddings_tmdb_media_kind_model_unique").on(
      table.tmdbId,
      table.mediaType,
      table.kind,
      table.embeddingModel,
    ),
    index("media_embeddings_cosine_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
)
  // Server-only: RLS enabled with ZERO policies denies all PostgREST/client
  // access, while the Drizzle connection bypasses RLS as table owner. Declared
  // here (not in rls-policies.sql) so `db:generate` emits it and a fresh DB
  // gets it from `db:migrate` alone — no dashboard step, no drift.
  .enableRLS();

// Append-only retrieval telemetry. Written fire-and-forget by the
// present_recommendations tool; NOT read by any current code path.
//
// It exists because user behavior cannot be backfilled. mood_embedding on
// ai_recommendations records what was asked; this records what was retrieved,
// what was chosen, and (joined against watchlist after the fact) whether the
// user acted. That triple is the training set for a learned reranker,
// collaborative filtering, the eval suite, and blend-weight tuning.
export const recommendationEvents = pgTable(
  "recommendation_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    // The model-distilled search query, not the raw user mood text.
    distilledQuery: text("distilled_query").notNull(),
    // The post-blend vector actually used for search.
    moodEmbedding: vector("mood_embedding", { dimensions: 768 }),
    candidateTmdbIds: integer("candidate_tmdb_ids").array(),
    picks: jsonb("picks"), // [{ tmdbId, mediaType, reason, rank }]
    embeddingModel: text("embedding_model").notNull(),
    // Bump whenever the system prompt changes, else rows stop being comparable.
    promptVersion: text("prompt_version").notNull(),
    // NULL on the happy path; else retrieval_unavailable | zero_candidates |
    // invalid_picks — so fallback rate is measurable without log scraping.
    fallbackReason: text("fallback_reason"),
    latencyMs: integer("latency_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("recommendation_events_user_id_idx").on(table.userId),
    index("recommendation_events_created_at_idx").on(table.createdAt),
  ],
)
  // Server-only telemetry, zero policies. Holds per-user retrieval history —
  // clients must never read another user's rows, and no client path reads this
  // table at all.
  .enableRLS();
