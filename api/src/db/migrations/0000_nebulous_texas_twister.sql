CREATE TYPE "public"."found_us_by_responses" AS ENUM('social-media', 'friends', 'event', 'online-search');--> statement-breakpoint
CREATE TYPE "public"."location_responses" AS ENUM('CV1', 'CV2', 'CV3', 'CV4', 'CV5', 'CV6', 'CV7', 'CV8', 'CV9', 'diaspora');--> statement-breakpoint
CREATE TYPE "public"."objective_responses" AS ENUM('discover-products', 'launch-product', 'networking', 'explore');--> statement-breakpoint
CREATE TYPE "public"."profile_responses" AS ENUM('student', 'technology-professional', 'founder', 'investor');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"profile_id" integer NOT NULL,
	"email" text NOT NULL,
	"fullName" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"bio" varchar NOT NULL,
	"profile_response" "profile_responses" NOT NULL,
	"objective_response" "objective_responses" NOT NULL,
	"location_response" "location_responses" NOT NULL,
	"found_us_by_response" "found_us_by_responses" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;