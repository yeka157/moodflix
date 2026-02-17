-- Migrate any existing 'watching' rows to 'want_to_watch'
UPDATE "watchlist" SET "status" = 'want_to_watch' WHERE "status" = 'watching';--> statement-breakpoint
ALTER TABLE "watchlist" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "watchlist" ALTER COLUMN "status" SET DEFAULT 'want_to_watch'::text;--> statement-breakpoint
DROP TYPE "public"."watchlist_status";--> statement-breakpoint
CREATE TYPE "public"."watchlist_status" AS ENUM('want_to_watch', 'watched');--> statement-breakpoint
ALTER TABLE "watchlist" ALTER COLUMN "status" SET DEFAULT 'want_to_watch'::"public"."watchlist_status";--> statement-breakpoint
ALTER TABLE "watchlist" ALTER COLUMN "status" SET DATA TYPE "public"."watchlist_status" USING "status"::"public"."watchlist_status";