CREATE TABLE "project_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"storage_key" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "file_uploads" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."file_upload_type";--> statement-breakpoint
CREATE TYPE "public"."file_upload_type" AS ENUM('project_logo', 'project_gallery');--> statement-breakpoint
ALTER TABLE "file_uploads" ALTER COLUMN "type" SET DATA TYPE "public"."file_upload_type" USING "type"::"public"."file_upload_type";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "youtube_video_id" varchar(11);--> statement-breakpoint
ALTER TABLE "project_images" ADD CONSTRAINT "project_images_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_images_project_position_idx" ON "project_images" USING btree ("project_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "project_images_storage_key_idx" ON "project_images" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "project_images_project_id_idx" ON "project_images" USING btree ("project_id");--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "banner_image_url";