ALTER TABLE "users" ADD COLUMN "onboarded_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "onboarding_complete";