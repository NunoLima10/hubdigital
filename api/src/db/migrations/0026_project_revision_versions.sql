ALTER TABLE "projects" ADD COLUMN "row_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "project_revisions" ADD COLUMN "base_version" integer DEFAULT 0 NOT NULL;