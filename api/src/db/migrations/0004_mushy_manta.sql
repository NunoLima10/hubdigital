CREATE TYPE "public"."access" AS ENUM('open_source', 'closed_source', 'private_beta', 'public_beta');--> statement-breakpoint
CREATE TYPE "public"."audience" AS ENUM('students', 'developers', 'businesses', 'government', 'general_public');--> statement-breakpoint
CREATE TYPE "public"."businessModel" AS ENUM('b2b', 'b2c', 'b2g', 'c2c', 'nonprofit');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('web', 'mobile', 'desktop', 'api', 'other');--> statement-breakpoint
CREATE TYPE "public"."pricing" AS ENUM('free', 'freemium', 'paid');--> statement-breakpoint
CREATE TYPE "public"."projectStage" AS ENUM('idea', 'development', 'mvp', 'launched', 'growth', 'maintenance', 'archived');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"publisher_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"slug" text NOT NULL,
	"short_description" varchar NOT NULL,
	"description" text,
	"website_url" text NOT NULL,
	"logo_url" text,
	"banner_image_url" text,
	"github_url" text,
	"pricing" "pricing" NOT NULL,
	"platform" "platform"[] NOT NULL,
	"businessModel" "businessModel" NOT NULL,
	"access" "access" NOT NULL,
	"projectStage" "projectStage" NOT NULL,
	"audience" "audience" NOT NULL,
	"category_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;