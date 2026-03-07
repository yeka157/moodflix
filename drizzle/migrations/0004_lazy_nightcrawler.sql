CREATE TABLE "tmdb_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"category" text NOT NULL,
	"media_type" "media_type" NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tmdb_cache_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "tmdb_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tmdb_id" integer NOT NULL,
	"media_type" "media_type" NOT NULL,
	"title" text NOT NULL,
	"overview" text,
	"poster_path" text,
	"backdrop_path" text,
	"release_date" text,
	"vote_average" text,
	"vote_count" integer,
	"genre_ids" jsonb,
	"popularity" text,
	"runtime" integer,
	"number_of_seasons" integer,
	"details_data" jsonb,
	"ratings_updated_at" timestamp with time zone,
	"details_fetched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tmdb_media_tmdb_media_unique" UNIQUE("tmdb_id","media_type")
);
