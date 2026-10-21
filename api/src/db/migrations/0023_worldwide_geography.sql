UPDATE "projects" SET "country" = NULL WHERE "country" = 'other';--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "country" SET DATA TYPE varchar(2) USING "country"::text;--> statement-breakpoint
DROP TYPE "public"."country";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "location_details" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "additional_locations" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "team_mode" varchar(16);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "local_connections" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "service_area" jsonb;