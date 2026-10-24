CREATE TYPE "public"."ai_involvement" AS ENUM('none', 'assisted', 'substantial', 'primarily_ai');--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "ai_involvement" "ai_involvement";