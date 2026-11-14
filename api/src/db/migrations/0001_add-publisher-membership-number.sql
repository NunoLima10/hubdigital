CREATE SEQUENCE "publishers_membership_number_seq";--> statement-breakpoint
ALTER TABLE "publishers" ADD COLUMN "membership_number" integer;--> statement-breakpoint
WITH ranked_publishers AS (
	SELECT "id", row_number() OVER (ORDER BY "created_at", "id")::integer AS "membership_number"
	FROM "publishers"
)
UPDATE "publishers"
SET "membership_number" = ranked_publishers."membership_number"
FROM ranked_publishers
WHERE "publishers"."id" = ranked_publishers."id";--> statement-breakpoint
SELECT setval(
	'publishers_membership_number_seq',
	COALESCE(MAX("membership_number"), 1),
	MAX("membership_number") IS NOT NULL
) FROM "publishers";--> statement-breakpoint
ALTER TABLE "publishers" ALTER COLUMN "membership_number" SET DEFAULT nextval('publishers_membership_number_seq');--> statement-breakpoint
ALTER TABLE "publishers" ALTER COLUMN "membership_number" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "publisher_membership_number_idx" ON "publishers" USING btree ("membership_number");
