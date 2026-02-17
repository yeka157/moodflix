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
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow(),
    watchedAt: timestamp("watched_at", { withTimezone: true }),
  },
  (table) => [
    unique("watchlist_user_tmdb_unique").on(table.userId, table.tmdbId),
  ],
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
