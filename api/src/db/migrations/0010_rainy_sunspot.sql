ALTER TABLE "publishers" ADD COLUMN "handle" varchar;--> statement-breakpoint
ALTER TABLE "publishers" ADD COLUMN "website_url" text;--> statement-breakpoint
ALTER TABLE "publishers" ADD COLUMN "github_url" text;--> statement-breakpoint
ALTER TABLE "publishers" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
CREATE UNIQUE INDEX "publisher_handle_idx" ON "publishers" USING btree ("handle");--> statement-breakpoint
-- Backfill: publishers that existed before profiles need a handle, otherwise
-- their profile page is unreachable. Derived from the display name, suffixed
-- with the row id so uniqueness is guaranteed without a second pass.
UPDATE "publishers" AS p
SET "handle" = COALESCE(
    NULLIF(trim(both '-' from lower(regexp_replace(u."name", '[^a-zA-Z0-9]+', '-', 'g'))), ''),
    'maker'
  ) || '-' || p."id"
FROM "users" AS u
WHERE u."id" = p."user_id" AND p."handle" IS NULL;
