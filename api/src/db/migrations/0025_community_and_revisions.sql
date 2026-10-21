CREATE TABLE "announcement_votes" (
	"announcement_id" integer NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"kind" varchar(24) NOT NULL,
	"introduction" varchar(1000) NOT NULL,
	"creation_key" varchar(36) NOT NULL,
	"status" varchar(16) NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_for" timestamp with time zone,
	"week" varchar(8),
	"rejection_reason" text,
	"reviewed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_makers" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"invited_by" text NOT NULL,
	"status" varchar(16) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"body" jsonb NOT NULL,
	"base_updated_at" timestamp with time zone NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"reason" text,
	"reviewed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcement_votes" ADD CONSTRAINT "announcement_votes_announcement_id_project_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."project_announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_votes" ADD CONSTRAINT "announcement_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_announcements" ADD CONSTRAINT "project_announcements_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_announcements" ADD CONSTRAINT "project_announcements_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_makers" ADD CONSTRAINT "project_makers_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_makers" ADD CONSTRAINT "project_makers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_makers" ADD CONSTRAINT "project_makers_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_revisions" ADD CONSTRAINT "project_revisions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_revisions" ADD CONSTRAINT "project_revisions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "announcement_votes_user_idx" ON "announcement_votes" USING btree ("announcement_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_announcements_creation_idx" ON "project_announcements" USING btree ("project_id","creation_key");--> statement-breakpoint
CREATE UNIQUE INDEX "project_first_release_idx" ON "project_announcements" USING btree ("project_id") WHERE "project_announcements"."kind"='first_release' and "project_announcements"."status"<>'rejected';--> statement-breakpoint
CREATE INDEX "project_announcements_week_idx" ON "project_announcements" USING btree ("week","status");--> statement-breakpoint
CREATE UNIQUE INDEX "project_makers_user_idx" ON "project_makers" USING btree ("project_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_pending_revision_idx" ON "project_revisions" USING btree ("project_id") WHERE "project_revisions"."status"='pending';