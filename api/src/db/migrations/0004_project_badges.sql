ALTER TYPE "public"."moderation_action" ADD VALUE 'project.badge_grant';--> statement-breakpoint
ALTER TYPE "public"."moderation_action" ADD VALUE 'project.badge_revoke';--> statement-breakpoint
CREATE TABLE "project_badge_awards" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"badge_key" varchar(40) NOT NULL,
	"period" varchar(10) DEFAULT '' NOT NULL,
	"rank" integer,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"awarded_by" text
);
--> statement-breakpoint
CREATE TABLE "weekly_ranking_results" (
	"week_id" varchar(8) NOT NULL,
	"project_id" integer NOT NULL,
	"rank" integer NOT NULL,
	"upvotes" integer NOT NULL,
	"closed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_ranking_results_week_id_project_id_pk" PRIMARY KEY("week_id","project_id")
);
--> statement-breakpoint
ALTER TABLE "project_badge_awards" ADD CONSTRAINT "project_badge_awards_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_badge_awards" ADD CONSTRAINT "project_badge_awards_awarded_by_users_id_fk" FOREIGN KEY ("awarded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_ranking_results" ADD CONSTRAINT "weekly_ranking_results_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_badge_awards_unique_idx" ON "project_badge_awards" USING btree ("project_id","badge_key","period");--> statement-breakpoint
CREATE INDEX "project_badge_awards_key_period_idx" ON "project_badge_awards" USING btree ("badge_key","period");--> statement-breakpoint
CREATE INDEX "weekly_ranking_results_project_idx" ON "weekly_ranking_results" USING btree ("project_id");