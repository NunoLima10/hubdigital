CREATE TYPE "public"."badge_award_mode" AS ENUM('automatic', 'manual');--> statement-breakpoint
ALTER TYPE "public"."moderation_action" ADD VALUE 'user.badge_grant';--> statement-breakpoint
ALTER TYPE "public"."moderation_action" ADD VALUE 'user.badge_revoke';--> statement-breakpoint
CREATE TABLE "badges" (
	"key" varchar(40) PRIMARY KEY NOT NULL,
	"award_mode" "badge_award_mode" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"badge_key" varchar(40) NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"awarded_by" text,
	"featured" boolean DEFAULT false NOT NULL,
	"seen_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_key_badges_key_fk" FOREIGN KEY ("badge_key") REFERENCES "public"."badges"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_awarded_by_users_id_fk" FOREIGN KEY ("awarded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_badges_user_badge_idx" ON "user_badges" USING btree ("user_id","badge_key");--> statement-breakpoint
CREATE UNIQUE INDEX "user_badges_featured_idx" ON "user_badges" USING btree ("user_id") WHERE "user_badges"."featured";--> statement-breakpoint
CREATE INDEX "user_badges_badge_idx" ON "user_badges" USING btree ("badge_key");--> statement-breakpoint
-- The initial catalog, so production can award badges without a seed run.
-- The seed keeps this table in step with badgeCatalog from here on.
INSERT INTO "badges" ("key", "award_mode", "sort_order") VALUES
	('founder', 'manual', 10),
	('maintainer', 'manual', 20),
	('founding-gold', 'automatic', 30),
	('founding-silver', 'automatic', 40),
	('founding-basalt', 'automatic', 50)
ON CONFLICT ("key") DO NOTHING;--> statement-breakpoint
-- Members #2–100 who joined before badges existed earn theirs now. seen_at
-- stays null so they get the "you earned a badge" moment on their next visit.
INSERT INTO "user_badges" ("user_id", "badge_key", "awarded_at", "featured")
SELECT
	"user_id",
	CASE
		WHEN "membership_number" <= 10 THEN 'founding-gold'
		WHEN "membership_number" <= 50 THEN 'founding-silver'
		ELSE 'founding-basalt'
	END,
	"created_at",
	true
FROM "publishers"
WHERE "membership_number" BETWEEN 2 AND 100
ON CONFLICT DO NOTHING;
