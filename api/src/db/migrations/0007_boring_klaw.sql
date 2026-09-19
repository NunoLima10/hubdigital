CREATE TYPE "public"."project_status" AS ENUM('draft', 'published');--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "status" "project_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "launched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "projects_launched_at_idx" ON "projects" USING btree ("launched_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
-- Backfill: every project that existed before the draft/publish split was
-- already publicly visible, so keep it that way and seed its launch week from
-- when it was created. Without this the homepage empties out on deploy.
UPDATE "projects"
SET "status" = 'published',
    "published_at" = COALESCE("published_at", "created_at"),
    "launched_at" = COALESCE("launched_at", "created_at")
WHERE "status" = 'draft';
