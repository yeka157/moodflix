CREATE INDEX "ai_recommendations_user_id_idx" ON "ai_recommendations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_subs_user_id_idx" ON "notification_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tmdb_media_tmdb_id_idx" ON "tmdb_media" USING btree ("tmdb_id");--> statement-breakpoint
CREATE INDEX "watchlist_user_id_idx" ON "watchlist" USING btree ("user_id");