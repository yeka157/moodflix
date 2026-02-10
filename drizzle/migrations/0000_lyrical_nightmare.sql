CREATE TYPE "public"."watchlist_status" AS ENUM('want_to_watch', 'watching', 'watched');--> statement-breakpoint
CREATE TABLE "ai_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"prompt" text NOT NULL,
	"recommendations" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "watchlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tmdb_id" integer NOT NULL,
	"title" text NOT NULL,
	"poster_path" text,
	"status" "watchlist_status" DEFAULT 'want_to_watch',
	"rating" integer,
	"added_at" timestamp with time zone DEFAULT now(),
	"watched_at" timestamp with time zone,
	CONSTRAINT "watchlist_user_tmdb_unique" UNIQUE("user_id","tmdb_id")
);
--> statement-breakpoint
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;