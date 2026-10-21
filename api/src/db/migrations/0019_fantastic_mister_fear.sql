ALTER TABLE "projects" ALTER COLUMN "short_description" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "website_url" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "pricing" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "platform" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "businessModel" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "access" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "projectStage" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "audience" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "category_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "creation_key" varchar(36);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "youtube_video_url" text;--> statement-breakpoint
CREATE UNIQUE INDEX "projects_publisher_creation_key_idx" ON "projects" USING btree ("publisher_id","creation_key");