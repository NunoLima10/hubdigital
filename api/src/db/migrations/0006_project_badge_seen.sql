ALTER TABLE "project_badge_awards" ADD COLUMN "seen_at" timestamp with time zone;--> statement-breakpoint
-- Awards held before celebrations existed count as seen: only new ones pop up.
UPDATE "project_badge_awards" SET "seen_at" = now();
