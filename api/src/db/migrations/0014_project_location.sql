CREATE TYPE "public"."country" AS ENUM('cv', 'pt', 'us', 'fr', 'nl', 'lu', 'it', 'br', 'es', 'other');--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "country" "country";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "municipality" varchar(5);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "zone" varchar(13);--> statement-breakpoint
-- The island enum changes from slugs to cv-location codes, and Postgres cannot
-- cast between two enums that share no values. Go through text so the rows that
-- already have an island can be remapped before the column takes the new type.
ALTER TABLE "projects" ALTER COLUMN "island" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."island";--> statement-breakpoint
-- The nine inhabited islands keep their place, now as a Cabo Verde location.
UPDATE "projects" SET
	"country" = 'cv',
	"island" = CASE "island"
		WHEN 'santo_antao' THEN 'CV1'
		WHEN 'sao_vicente' THEN 'CV2'
		WHEN 'sao_nicolau' THEN 'CV3'
		WHEN 'sal' THEN 'CV4'
		WHEN 'boa_vista' THEN 'CV5'
		WHEN 'maio' THEN 'CV6'
		WHEN 'santiago' THEN 'CV7'
		WHEN 'fogo' THEN 'CV8'
		WHEN 'brava' THEN 'CV9'
	END
WHERE "island" IN ('santo_antao', 'sao_vicente', 'sao_nicolau', 'sal', 'boa_vista', 'maio', 'santiago', 'fogo', 'brava');--> statement-breakpoint
-- "diaspora" said only that the project is abroad, which is now a country. The
-- real one is unknown, so it lands on "other" rather than a guess.
UPDATE "projects" SET "country" = 'other', "island" = NULL WHERE "island" = 'diaspora';--> statement-breakpoint
-- Santa Luzia is uninhabited and has no entry in the location dataset, so there
-- is no truthful location to carry over. Left empty, like projects that predate
-- the field.
UPDATE "projects" SET "island" = NULL WHERE "island" = 'santa_luzia';--> statement-breakpoint
CREATE TYPE "public"."island" AS ENUM('CV1', 'CV2', 'CV3', 'CV4', 'CV5', 'CV6', 'CV7', 'CV8', 'CV9');--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "island" SET DATA TYPE "public"."island" USING "island"::"public"."island";--> statement-breakpoint
CREATE INDEX "projects_country_idx" ON "projects" USING btree ("country");
