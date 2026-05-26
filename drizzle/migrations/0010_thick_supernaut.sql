DROP INDEX "notifications_user_unread_idx";--> statement-breakpoint
DROP INDEX "notifications_user_created_idx";--> statement-breakpoint
CREATE INDEX "notifications_user_unread_partial_idx" ON "notifications" USING btree ("user_id","created_at" DESC NULLS LAST) WHERE "notifications"."read_at" IS NULL;--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at" DESC NULLS LAST);