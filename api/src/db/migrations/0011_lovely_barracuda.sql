CREATE TYPE "public"."island" AS ENUM('santo_antao', 'sao_vicente', 'santa_luzia', 'sao_nicolau', 'sal', 'boa_vista', 'maio', 'santiago', 'fogo', 'brava', 'diaspora');--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "island" "island";--> statement-breakpoint
CREATE INDEX "projects_island_idx" ON "projects" USING btree ("island");