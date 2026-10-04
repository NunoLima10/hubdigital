CREATE TYPE "public"."project_event_source" AS ENUM('web', 'app');--> statement-breakpoint
CREATE TYPE "public"."project_event_type" AS ENUM('view', 'visit');--> statement-breakpoint
CREATE TABLE "project_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"type" "project_event_type" NOT NULL,
	"source" "project_event_source" DEFAULT 'web' NOT NULL,
	"day" date NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_events" ADD CONSTRAINT "project_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_events_bucket_idx" ON "project_events" USING btree ("project_id","type","source","day");--> statement-breakpoint
CREATE INDEX "project_events_project_day_idx" ON "project_events" USING btree ("project_id","day");