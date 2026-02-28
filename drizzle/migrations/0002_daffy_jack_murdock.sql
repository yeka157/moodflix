CREATE TYPE "public"."media_type" AS ENUM('movie', 'tv');--> statement-breakpoint
CREATE TABLE "ai_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"messages" jsonb NOT NULL,
	"prompt" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "top_hundred" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tmdb_id" integer NOT NULL,
	"media_type" "media_type" NOT NULL,
	"rank" integer NOT NULL,
	"title" text NOT NULL,
	"poster_path" text,
	"added_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "top_hundred_user_rank_unique" UNIQUE("user_id","rank"),
	CONSTRAINT "top_hundred_user_tmdb_media_unique" UNIQUE("user_id","tmdb_id","media_type")
);
--> statement-breakpoint
ALTER TABLE "watchlist" DROP CONSTRAINT "watchlist_user_tmdb_unique";--> statement-breakpoint
ALTER TABLE "watchlist" ADD COLUMN "media_type" "media_type" DEFAULT 'movie' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "top_hundred" ADD CONSTRAINT "top_hundred_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_user_tmdb_media_unique" UNIQUE("user_id","tmdb_id","media_type");