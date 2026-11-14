import { projectLinkKindValues } from "@hubdigital/shared";
import { sql } from "drizzle-orm";
import { boolean, integer, pgEnum, pgTable, serial, text, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const projectLinkKindEnum = pgEnum("project_link_kind", projectLinkKindValues);
export const projectLinks = pgTable("project_links", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  kind: projectLinkKindEnum("kind").notNull(), url: text("url").notNull(),
  label: varchar("label", { length: 80 }), position: integer("position").notNull(),
  referralAttribution: boolean("referral_attribution").notNull().default(false),
  isPrimary: boolean("is_primary").notNull().default(false),
}, (table) => [
  uniqueIndex("project_links_primary_idx").on(table.projectId).where(sql`${table.isPrimary} = true`),
  uniqueIndex("project_links_position_idx").on(table.projectId, table.position),
]);
