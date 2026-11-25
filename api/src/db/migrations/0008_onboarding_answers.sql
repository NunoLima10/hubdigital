-- Makers can now pick several profiles and objectives. Each existing answer
-- becomes a one-item list, so nobody loses what they already chose.
ALTER TABLE "publishers" ALTER COLUMN "profile_response" SET DATA TYPE "public"."profile_responses"[] USING ARRAY["profile_response"];--> statement-breakpoint
ALTER TABLE "publishers" ALTER COLUMN "objective_response" SET DATA TYPE "public"."objective_responses"[] USING ARRAY["objective_response"];--> statement-breakpoint
-- The island a maker in the diaspora comes from. Stays empty for people who
-- live in Cabo Verde and for diaspora members who joined before it was asked.
ALTER TABLE "publishers" ADD COLUMN "origin_island" varchar(3);
