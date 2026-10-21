CREATE TYPE "public"."project_link_kind" AS ENUM('website', 'app_store', 'repository', 'demo', 'documentation', 'pricing', 'community', 'crowdfunding', 'email', 'whatsapp', 'other');--> statement-breakpoint
CREATE TYPE "public"."availability" AS ENUM('not_available', 'waitlist', 'invite_only', 'public_beta', 'available', 'unavailable');--> statement-breakpoint
CREATE TYPE "public"."source_model" AS ENUM('open_source', 'source_available', 'proprietary', 'not_applicable', 'not_disclosed');--> statement-breakpoint
ALTER TYPE "public"."pricing" ADD VALUE 'contact_for_quote';--> statement-breakpoint
ALTER TYPE "public"."pricing" ADD VALUE 'not_decided';--> statement-breakpoint
ALTER TYPE "public"."pricing" ADD VALUE 'not_applicable';--> statement-breakpoint
CREATE TABLE "project_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"kind" "project_link_kind" NOT NULL,
	"url" text NOT NULL,
	"label" varchar(80),
	"position" integer NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "businessModel" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."businessModel";--> statement-breakpoint
CREATE TYPE "public"."businessModel" AS ENUM('b2b', 'b2c', 'b2g', 'c2c');--> statement-breakpoint
UPDATE "projects" SET "businessModel" = NULL WHERE "businessModel" = 'nonprofit';--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "businessModel" SET DATA TYPE "public"."businessModel" USING "businessModel"::"public"."businessModel";--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "platform" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "platform" SET DATA TYPE text[] USING "platform"::text[];--> statement-breakpoint
UPDATE "projects" SET "platform" = array_remove("platform", 'mobile');--> statement-breakpoint
DROP TYPE "public"."platform";--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('web', 'android', 'ios', 'desktop', 'api', 'cli', 'library', 'browser_extension', 'hardware', 'other');--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "platform" SET DATA TYPE "public"."platform"[] USING "platform"::"public"."platform"[];--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "platform" SET DEFAULT '{}'::"public"."platform"[];--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "projectStage" SET DATA TYPE text;--> statement-breakpoint
UPDATE "projects" SET "projectStage" = CASE "projectStage" WHEN 'development' THEN 'building' WHEN 'mvp' THEN 'prototype' WHEN 'launched' THEN 'live' WHEN 'growth' THEN 'live' WHEN 'maintenance' THEN 'live' WHEN 'archived' THEN 'discontinued' ELSE "projectStage" END;--> statement-breakpoint
DROP TYPE "public"."projectStage";--> statement-breakpoint
CREATE TYPE "public"."projectStage" AS ENUM('idea', 'building', 'prototype', 'live', 'paused', 'discontinued');--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "projectStage" SET DATA TYPE "public"."projectStage" USING "projectStage"::"public"."projectStage";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "availability" "availability";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "source_model" "source_model";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "license_id" varchar(80);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "audiences" "audience"[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD COLUMN "byte_size" integer;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "project_links" ADD CONSTRAINT "project_links_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_links_primary_idx" ON "project_links" USING btree ("project_id") WHERE "project_links"."is_primary" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "project_links_position_idx" ON "project_links" USING btree ("project_id","position");--> statement-breakpoint
INSERT INTO "project_links" (project_id, kind, url, position, is_primary)
SELECT id, 'website', website_url, 0, true FROM "projects" WHERE website_url <> '';--> statement-breakpoint
INSERT INTO "project_links" (project_id, kind, url, position, is_primary)
SELECT id, 'repository', github_url, CASE WHEN website_url = '' THEN 0 ELSE 1 END, website_url = ''
FROM "projects" WHERE github_url IS NOT NULL AND github_url <> '' AND github_url <> website_url;--> statement-breakpoint
UPDATE "projects" SET availability = CASE
  WHEN access::text = 'private_beta' THEN 'invite_only'::availability
  WHEN access::text = 'public_beta' THEN 'public_beta'::availability
  WHEN "projectStage"::text IN ('idea', 'building') THEN 'not_available'::availability
  WHEN website_url <> '' THEN 'available'::availability ELSE 'not_available'::availability END,
  source_model = CASE WHEN access::text = 'open_source' THEN 'open_source'::source_model WHEN access::text = 'closed_source' THEN 'proprietary'::source_model ELSE NULL END,
  audiences = CASE WHEN audience IS NULL THEN '{}'::audience[] ELSE ARRAY[audience] END;--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "website_url";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "github_url";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "access";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "audience";--> statement-breakpoint
DROP TYPE "public"."access";