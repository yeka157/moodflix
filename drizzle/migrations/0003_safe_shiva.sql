ALTER TABLE "ai_conversations" ADD COLUMN "conversation_id" text;--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
CREATE UNIQUE INDEX "ai_conversations_conversation_id_unique" ON "ai_conversations" USING btree ("conversation_id") WHERE "ai_conversations"."conversation_id" IS NOT NULL;