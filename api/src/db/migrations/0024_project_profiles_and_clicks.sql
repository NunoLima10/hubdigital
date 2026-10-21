CREATE TABLE "project_link_clicks" (
	"id" serial PRIMARY KEY NOT NULL,
	"link_id" integer NOT NULL,
	"day" date NOT NULL,
	"surface" varchar(16) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_links" ADD COLUMN "referral_attribution" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "languages" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "help_wanted" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "help_description" varchar(500);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "team_description" varchar(500);--> statement-breakpoint
ALTER TABLE "project_link_clicks" ADD CONSTRAINT "project_link_clicks_link_id_project_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."project_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_link_clicks_bucket_idx" ON "project_link_clicks" USING btree ("link_id","day","surface");