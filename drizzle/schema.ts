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
