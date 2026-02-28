import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";

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
  ]
);

export const aiRecommendations = pgTable("ai_recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  recommendations: jsonb("recommendations").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// NEW: ai_conversations for analytics logging (fire-and-forget, backend only)
export const aiConversations = pgTable("ai_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  messages: jsonb("messages").notNull(),
  prompt: text("prompt"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

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
