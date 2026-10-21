-- Retired kinds: keep web destinations as "other" with their former name; contact links have no HTTP destination and are removed.
UPDATE "project_links" SET "kind" = 'other', "label" = COALESCE("label", CASE "kind" WHEN 'pricing' THEN 'Preços' WHEN 'community' THEN 'Comunidade' ELSE 'Financiamento coletivo' END) WHERE "kind" IN ('pricing', 'community', 'crowdfunding');--> statement-breakpoint
DELETE FROM "project_links" WHERE "kind" IN ('email', 'whatsapp');--> statement-breakpoint
ALTER TABLE "project_links" ALTER COLUMN "kind" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."project_link_kind";--> statement-breakpoint
CREATE TYPE "public"."project_link_kind" AS ENUM('website', 'app_store', 'repository', 'demo', 'documentation', 'other');--> statement-breakpoint
ALTER TABLE "project_links" ALTER COLUMN "kind" SET DATA TYPE "public"."project_link_kind" USING "kind"::"public"."project_link_kind";