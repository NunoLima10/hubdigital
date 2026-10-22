-- Trigram GIN indexes on projects (free-text search) need this before the tables.
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TYPE "public"."moderation_action" AS ENUM('project.approve', 'project.reject', 'project.unpublish', 'project.restore', 'project.shadow_ban', 'project.unshadow_ban', 'project.edit_published', 'user.shadow_ban', 'user.unshadow_ban', 'comment.hide', 'comment.unhide', 'comment.delete', 'publisher.trust', 'publisher.untrust', 'setting.update', 'report.resolve', 'category.create', 'category.update');--> statement-breakpoint
CREATE TYPE "public"."moderation_target" AS ENUM('project', 'user', 'comment', 'publisher', 'setting', 'report');--> statement-breakpoint
CREATE TYPE "public"."project_event_source" AS ENUM('web', 'app');--> statement-breakpoint
CREATE TYPE "public"."project_event_type" AS ENUM('view', 'visit');--> statement-breakpoint
CREATE TYPE "public"."project_link_kind" AS ENUM('website', 'app_store', 'repository', 'demo', 'documentation', 'other');--> statement-breakpoint
CREATE TYPE "public"."audience" AS ENUM('students', 'developers', 'businesses', 'government', 'general_public');--> statement-breakpoint
CREATE TYPE "public"."availability" AS ENUM('not_available', 'waitlist', 'invite_only', 'public_beta', 'available', 'unavailable');--> statement-breakpoint
CREATE TYPE "public"."business_model" AS ENUM('b2b', 'b2c', 'b2g', 'c2c');--> statement-breakpoint
CREATE TYPE "public"."island" AS ENUM('CV1', 'CV2', 'CV3', 'CV4', 'CV5', 'CV6', 'CV7', 'CV8', 'CV9');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('web', 'android', 'ios', 'desktop', 'api', 'cli', 'library', 'browser_extension', 'hardware', 'other');--> statement-breakpoint
CREATE TYPE "public"."pricing" AS ENUM('free', 'freemium', 'paid', 'contact_for_quote', 'not_decided', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."project_stage" AS ENUM('idea', 'building', 'prototype', 'live', 'paused', 'discontinued');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'published', 'pending', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."source_model" AS ENUM('open_source', 'source_available', 'proprietary', 'not_applicable', 'not_disclosed');--> statement-breakpoint
CREATE TYPE "public"."found_us_by_responses" AS ENUM('social-media', 'friends', 'event', 'online-search');--> statement-breakpoint
CREATE TYPE "public"."location_responses" AS ENUM('CV1', 'CV2', 'CV3', 'CV4', 'CV5', 'CV6', 'CV7', 'CV8', 'CV9', 'diaspora');--> statement-breakpoint
CREATE TYPE "public"."objective_responses" AS ENUM('discover-products', 'launch-product', 'networking', 'explore');--> statement-breakpoint
CREATE TYPE "public"."profile_responses" AS ENUM('student', 'technology-professional', 'founder', 'investor');--> statement-breakpoint
CREATE TYPE "public"."report_reason" AS ENUM('spam', 'offensive', 'misleading', 'not_cabo_verde', 'broken_link', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('open', 'reviewing', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."report_target" AS ENUM('project', 'comment', 'user');--> statement-breakpoint
CREATE TYPE "public"."file_upload_type" AS ENUM('project_logo', 'project_gallery', 'user_avatar');--> statement-breakpoint
CREATE TYPE "public"."link_click_surface" AS ENUM('detail', 'card', 'map');--> statement-breakpoint
CREATE TYPE "public"."announcement_kind" AS ENUM('presentation', 'first_release', 'major_update');--> statement-breakpoint
CREATE TYPE "public"."announcement_status" AS ENUM('pending', 'published', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."maker_membership_status" AS ENUM('pending', 'accepted');--> statement-breakpoint
CREATE TYPE "public"."project_revision_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp with time zone,
	"onboarded_at" timestamp with time zone,
	"shadow_banned_at" timestamp with time zone,
	"shadow_banned_by" text,
	"shadow_ban_reason" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"parent_id" integer,
	"body" text NOT NULL,
	"deleted_at" timestamp with time zone,
	"hidden_at" timestamp with time zone,
	"hidden_by" text,
	"moderation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_id" text,
	"actor_email" varchar(255),
	"action" "moderation_action" NOT NULL,
	"target_type" "moderation_target" NOT NULL,
	"target_id" varchar(64) NOT NULL,
	"reason" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_event_visitors" (
	"project_id" integer NOT NULL,
	"type" "project_event_type" NOT NULL,
	"source" "project_event_source" NOT NULL,
	"day" date NOT NULL,
	"visitor" varchar(32) NOT NULL,
	CONSTRAINT "project_event_visitors_project_id_type_source_day_visitor_pk" PRIMARY KEY("project_id","type","source","day","visitor")
);
--> statement-breakpoint
CREATE TABLE "project_events" (
	"project_id" integer NOT NULL,
	"type" "project_event_type" NOT NULL,
	"source" "project_event_source" DEFAULT 'web' NOT NULL,
	"day" date NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_events_project_id_type_source_day_pk" PRIMARY KEY("project_id","type","source","day")
);
--> statement-breakpoint
CREATE TABLE "project_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"storage_key" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"kind" "project_link_kind" NOT NULL,
	"url" text NOT NULL,
	"label" varchar(80),
	"position" integer NOT NULL,
	"referral_attribution" boolean DEFAULT false NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_upvotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"ip_address" varchar(64),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"publisher_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"slug" text NOT NULL,
	"short_description" varchar DEFAULT '' NOT NULL,
	"description" text,
	"row_version" integer DEFAULT 0 NOT NULL,
	"creation_key" varchar(36),
	"logo_key" text,
	"youtube_video_url" text,
	"pricing" "pricing",
	"platform" "platform"[] DEFAULT '{}' NOT NULL,
	"business_model" "business_model",
	"availability" "availability",
	"source_model" "source_model",
	"license_id" varchar(80),
	"project_stage" "project_stage",
	"audiences" "audience"[] DEFAULT '{}' NOT NULL,
	"country" varchar(2),
	"location_details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"additional_locations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"team_mode" varchar(16),
	"local_connections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"service_area" jsonb,
	"island" "island",
	"municipality" varchar(5),
	"zone" varchar(13),
	"languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"help_wanted" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"help_description" varchar(500),
	"team_description" varchar(500),
	"category_id" integer,
	"status" "project_status" DEFAULT 'draft' NOT NULL,
	"queued_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	"rejection_reason" text,
	"shadow_banned_at" timestamp with time zone,
	"shadow_banned_by" text,
	"shadow_ban_reason" text,
	"published_at" timestamp with time zone,
	"launched_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "publishers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"handle" varchar(30) NOT NULL,
	"bio" varchar NOT NULL,
	"website_url" text,
	"github_url" text,
	"linkedin_url" text,
	"instagram_url" text,
	"profile_response" "profile_responses" NOT NULL,
	"objective_response" "objective_responses" NOT NULL,
	"location_response" "location_responses" NOT NULL,
	"diaspora_country" varchar(5),
	"found_us_by_response" "found_us_by_responses" NOT NULL,
	"trusted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "publisher_handle_lowercase" CHECK ("publishers"."handle" = lower("publishers"."handle"))
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_id" text NOT NULL,
	"target_type" "report_target" NOT NULL,
	"target_id" varchar(64) NOT NULL,
	"reason" "report_reason" NOT NULL,
	"details" text,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"resolved_by" text,
	"resolved_at" timestamp with time zone,
	"resolution_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"user_id" text NOT NULL,
	"type" "file_upload_type" NOT NULL,
	"content_type" varchar(100),
	"byte_size" integer,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "file_uploads_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "project_secondary_categories" (
	"project_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "project_secondary_categories_project_id_category_id_pk" PRIMARY KEY("project_id","category_id"),
	CONSTRAINT "project_secondary_categories_position_check" CHECK ("project_secondary_categories"."position" in (0, 1))
);
--> statement-breakpoint
CREATE TABLE "project_link_clicks" (
	"link_id" integer NOT NULL,
	"day" date NOT NULL,
	"surface" "link_click_surface" NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "project_link_clicks_link_id_day_surface_pk" PRIMARY KEY("link_id","day","surface")
);
--> statement-breakpoint
CREATE TABLE "announcement_votes" (
	"announcement_id" integer NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "announcement_votes_announcement_id_user_id_pk" PRIMARY KEY("announcement_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "project_announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"kind" "announcement_kind" NOT NULL,
	"introduction" varchar(1000) NOT NULL,
	"creation_key" varchar(36) NOT NULL,
	"status" "announcement_status" NOT NULL,
	"published_at" timestamp with time zone,
	"rejection_reason" text,
	"reviewed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_makers" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"invited_by" text,
	"status" "maker_membership_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"body" jsonb NOT NULL,
	"base_version" integer DEFAULT 0 NOT NULL,
	"base_updated_at" timestamp with time zone NOT NULL,
	"status" "project_revision_status" DEFAULT 'pending' NOT NULL,
	"reason" text,
	"reviewed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_shadow_banned_by_users_id_fk" FOREIGN KEY ("shadow_banned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_hidden_by_users_id_fk" FOREIGN KEY ("hidden_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_event_visitors" ADD CONSTRAINT "project_event_visitors_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_events" ADD CONSTRAINT "project_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_images" ADD CONSTRAINT "project_images_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_links" ADD CONSTRAINT "project_links_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_favorites" ADD CONSTRAINT "project_favorites_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_favorites" ADD CONSTRAINT "project_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_upvotes" ADD CONSTRAINT "project_upvotes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_upvotes" ADD CONSTRAINT "project_upvotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_shadow_banned_by_users_id_fk" FOREIGN KEY ("shadow_banned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publishers" ADD CONSTRAINT "publishers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_secondary_categories" ADD CONSTRAINT "project_secondary_categories_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_secondary_categories" ADD CONSTRAINT "project_secondary_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_link_clicks" ADD CONSTRAINT "project_link_clicks_link_id_project_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."project_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_votes" ADD CONSTRAINT "announcement_votes_announcement_id_project_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."project_announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_votes" ADD CONSTRAINT "announcement_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_announcements" ADD CONSTRAINT "project_announcements_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_announcements" ADD CONSTRAINT "project_announcements_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_makers" ADD CONSTRAINT "project_makers_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_makers" ADD CONSTRAINT "project_makers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_makers" ADD CONSTRAINT "project_makers_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_revisions" ADD CONSTRAINT "project_revisions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_revisions" ADD CONSTRAINT "project_revisions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_shadow_banned_idx" ON "users" USING btree ("shadow_banned_at") WHERE "users"."shadow_banned_at" is not null;--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "comments_project_created_idx" ON "comments" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "comments_parent_idx" ON "comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "comments_user_idx" ON "comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "moderation_actions_target_idx" ON "moderation_actions" USING btree ("target_type","target_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "moderation_actions_actor_idx" ON "moderation_actions" USING btree ("actor_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "moderation_actions_created_idx" ON "moderation_actions" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "project_event_visitors_day_idx" ON "project_event_visitors" USING btree ("day");--> statement-breakpoint
CREATE INDEX "project_events_project_day_idx" ON "project_events" USING btree ("project_id","day");--> statement-breakpoint
CREATE UNIQUE INDEX "project_images_project_position_idx" ON "project_images" USING btree ("project_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "project_images_storage_key_idx" ON "project_images" USING btree ("storage_key");--> statement-breakpoint
CREATE UNIQUE INDEX "project_links_primary_idx" ON "project_links" USING btree ("project_id") WHERE "project_links"."is_primary" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "project_links_position_idx" ON "project_links" USING btree ("project_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "project_favorites_project_user_idx" ON "project_favorites" USING btree ("project_id","user_id");--> statement-breakpoint
CREATE INDEX "project_favorites_user_created_idx" ON "project_favorites" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "project_upvotes_project_user_idx" ON "project_upvotes" USING btree ("project_id","user_id");--> statement-breakpoint
CREATE INDEX "project_upvotes_user_idx" ON "project_upvotes" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_publisher_creation_key_idx" ON "projects" USING btree ("publisher_id","creation_key");--> statement-breakpoint
CREATE INDEX "projects_launched_at_idx" ON "projects" USING btree ("launched_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "projects_status_published_idx" ON "projects" USING btree ("status","published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "projects_category_idx" ON "projects" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "projects_name_trgm_idx" ON "projects" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "projects_short_description_trgm_idx" ON "projects" USING gin ("short_description" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "projects_additional_locations_idx" ON "projects" USING gin ("additional_locations" jsonb_path_ops);--> statement-breakpoint
CREATE INDEX "projects_country_idx" ON "projects" USING btree ("country");--> statement-breakpoint
CREATE INDEX "projects_island_idx" ON "projects" USING btree ("island");--> statement-breakpoint
CREATE INDEX "projects_status_queued_idx" ON "projects" USING btree ("status","queued_at");--> statement-breakpoint
CREATE INDEX "projects_shadow_banned_idx" ON "projects" USING btree ("shadow_banned_at") WHERE "projects"."shadow_banned_at" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "publisher_user_idx" ON "publishers" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "publisher_handle_idx" ON "publishers" USING btree ("handle");--> statement-breakpoint
CREATE UNIQUE INDEX "reports_reporter_target_idx" ON "reports" USING btree ("reporter_id","target_type","target_id");--> statement-breakpoint
CREATE INDEX "reports_target_idx" ON "reports" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "file_uploads_user_id_idx" ON "file_uploads" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_secondary_categories_position_idx" ON "project_secondary_categories" USING btree ("project_id","position");--> statement-breakpoint
CREATE INDEX "project_secondary_categories_category_idx" ON "project_secondary_categories" USING btree ("category_id","project_id");--> statement-breakpoint
CREATE INDEX "announcement_votes_user_idx" ON "announcement_votes" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_announcements_creation_idx" ON "project_announcements" USING btree ("project_id","creation_key");--> statement-breakpoint
CREATE UNIQUE INDEX "project_first_release_idx" ON "project_announcements" USING btree ("project_id") WHERE "project_announcements"."kind"='first_release' and "project_announcements"."status"<>'rejected';--> statement-breakpoint
CREATE INDEX "project_announcements_published_idx" ON "project_announcements" USING btree ("status","published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "project_makers_user_idx" ON "project_makers" USING btree ("project_id","user_id");--> statement-breakpoint
CREATE INDEX "project_makers_invitations_idx" ON "project_makers" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "project_pending_revision_idx" ON "project_revisions" USING btree ("project_id") WHERE "project_revisions"."status"='pending';--> statement-breakpoint
CREATE INDEX "project_revisions_project_created_idx" ON "project_revisions" USING btree ("project_id","created_at" DESC NULLS LAST);