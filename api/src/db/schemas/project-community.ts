import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { projects } from "./projects";
import { users } from "./auth";
export const projectAnnouncements = pgTable(
  "project_announcements",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 24 })
      .$type<import("@hubdigital/shared").Announcement["kind"]>()
      .notNull(),
    introduction: varchar("introduction", { length: 1000 }).notNull(),
    creationKey: varchar("creation_key", { length: 36 }).notNull(),
    status: varchar("status", { length: 16 })
      .$type<"pending" | "published" | "rejected">()
      .notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "string" }),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true, mode: "string" }),
    week: varchar("week", { length: 8 }),
    rejectionReason: text("rejection_reason"),
    reviewedBy: text("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("project_announcements_creation_idx").on(table.projectId, table.creationKey),
    uniqueIndex("project_first_release_idx")
      .on(table.projectId)
      .where(sql`${table.kind}='first_release' and ${table.status}<>'rejected'`),
    index("project_announcements_week_idx").on(table.week, table.status),
  ],
);
export const announcementVotes = pgTable(
  "announcement_votes",
  {
    announcementId: integer("announcement_id")
      .notNull()
      .references(() => projectAnnouncements.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("announcement_votes_user_idx").on(table.announcementId, table.userId)],
);
export const projectMakers = pgTable(
  "project_makers",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 16 }).$type<"pending" | "accepted">().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("project_makers_user_idx").on(table.projectId, table.userId)],
);
export const projectRevisions = pgTable(
  "project_revisions",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    body: jsonb("body").$type<import("@hubdigital/shared").ProjectBody>().notNull(),
    baseVersion: integer("base_version").notNull().default(0),
    baseUpdatedAt: timestamp("base_updated_at", { withTimezone: true, mode: "string" }).notNull(),
    status: varchar("status", { length: 16 })
      .$type<"pending" | "approved" | "rejected">()
      .notNull()
      .default("pending"),
    reason: text("reason"),
    reviewedBy: text("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("project_pending_revision_idx")
      .on(table.projectId)
      .where(sql`${table.status}='pending'`),
  ],
);
