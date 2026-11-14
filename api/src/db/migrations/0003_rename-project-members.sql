-- Project teams no longer use the old "makers" naming. Renames keep existing
-- invitations; declined invitations are now kept so the owner sees the answer.
ALTER TYPE "public"."maker_membership_status" RENAME TO "project_member_status";--> statement-breakpoint
ALTER TYPE "public"."project_member_status" ADD VALUE IF NOT EXISTS 'declined';--> statement-breakpoint
ALTER TABLE "project_makers" RENAME TO "project_members";--> statement-breakpoint
ALTER SEQUENCE IF EXISTS "project_makers_id_seq" RENAME TO "project_members_id_seq";--> statement-breakpoint
ALTER TABLE "project_members" RENAME CONSTRAINT "project_makers_pkey" TO "project_members_pkey";--> statement-breakpoint
ALTER TABLE "project_members" RENAME CONSTRAINT "project_makers_project_id_projects_id_fk" TO "project_members_project_id_projects_id_fk";--> statement-breakpoint
ALTER TABLE "project_members" RENAME CONSTRAINT "project_makers_user_id_users_id_fk" TO "project_members_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "project_members" RENAME CONSTRAINT "project_makers_invited_by_users_id_fk" TO "project_members_invited_by_users_id_fk";--> statement-breakpoint
ALTER INDEX "project_makers_user_idx" RENAME TO "project_members_user_idx";--> statement-breakpoint
ALTER INDEX "project_makers_invitations_idx" RENAME TO "project_members_invitations_idx";
