CREATE TABLE "media_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tmdb_id" integer NOT NULL,
	"media_type" "media_type" NOT NULL,
	"kind" text DEFAULT 'summary' NOT NULL,
	"embedding_model" text NOT NULL,
	"dims" smallint NOT NULL,
	"embedding" vector(768) NOT NULL,
	"origin_countries" text[],
	"embedded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"distilled_query" text NOT NULL,
	"mood_embedding" vector(768),
	"candidate_tmdb_ids" integer[],
	"picks" jsonb,
	"embedding_model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"fallback_reason" text,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ai_recommendations" ADD COLUMN "mood_embedding" vector(768);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "taste_vector" vector(768);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "taste_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recommendation_events" ADD CONSTRAINT "recommendation_events_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "media_embeddings_tmdb_media_kind_model_unique" ON "media_embeddings" USING btree ("tmdb_id","media_type","kind","embedding_model");--> statement-breakpoint
CREATE INDEX "media_embeddings_cosine_idx" ON "media_embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "recommendation_events_user_id_idx" ON "recommendation_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recommendation_events_created_at_idx" ON "recommendation_events" USING btree ("created_at");--> statement-breakpoint
-- HAND-WRITTEN (not emitted by drizzle-kit): lexical search column for future
-- hybrid BM25 + vector RRF fusion. Unused by current code — added now so the
-- fusion query is later a query change, not a migration.
-- Deliberately absent from drizzle/schema.ts (Drizzle 0.45 has no native
-- tsvector type). See the warning comment above tmdbMedia in schema.ts:
-- future `db:generate` runs will try to DROP this column.
-- Note: the 2-arg to_tsvector(regconfig, text) form is IMMUTABLE, which the
-- generated-column expression requires; the 1-arg form is only STABLE and
-- would be rejected.
ALTER TABLE "tmdb_media" ADD COLUMN "search_tsv" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce("title", '') || ' ' || coalesce("overview", ''))
  ) STORED;--> statement-breakpoint
CREATE INDEX "tmdb_media_search_tsv_idx" ON "tmdb_media" USING GIN ("search_tsv");