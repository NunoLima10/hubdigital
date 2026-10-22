import {
  announcementKindValues,
  announcementStatusValues,
  makerMembershipStatusValues,
  projectRevisionStatusValues,
  type ProjectBody,
} from "@hubdigital/shared";
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { projects } from "./projects";

export const announcementKindEnum = pgEnum("announcement_kind", announcementKindValues);
export const announcementStatusEnum = pgEnum("announcement_status", announcementStatusValues);
export const makerMembershipStatusEnum = pgEnum(
  "maker_membership_status",
  makerMembershipStatusValues,
);
export const projectRevisionStatusEnum = pgEnum(
  "project_revision_status",
  projectRevisionStatusValues,
);

/**
 * The weekly ranking a published announcement belongs to is derived from
 * `published_at` (see utils/week.ts), never stored next to it.
 */
export const projectAnnouncements = pgTable(
  "project_announcements",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    kind: announcementKindEnum("kind").notNull(),
    introduction: varchar("introduction", { length: 1000 }).notNull(),
    creationKey: varchar("creation_key", { length: 36 }).notNull(),
    status: announcementStatusEnum("status").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "string" }),
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
    // A weekly listing is a published_at range over published rows.
    index("project_announcements_published_idx").on(table.status, table.publishedAt),
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
  (table) => [
    primaryKey({ columns: [table.announcementId, table.userId] }),
    index("announcement_votes_user_idx").on(table.userId),
  ],
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
    // Detaches rather than cascades: the inviter leaving must not remove other
    // people from the team.
    invitedBy: text("invited_by").references(() => users.id, { onDelete: "set null" }),
    status: makerMembershipStatusEnum("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("project_makers_user_idx").on(table.projectId, table.userId),
    index("project_makers_invitations_idx").on(table.userId, table.status),
  ],
);

export const projectRevisions = pgTable(
  "project_revisions",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    body: jsonb("body").$type<ProjectBody>().notNull(),
    baseVersion: integer("base_version").notNull().default(0),
    baseUpdatedAt: timestamp("base_updated_at", { withTimezone: true, mode: "string" }).notNull(),
    status: projectRevisionStatusEnum("status").notNull().default("pending"),
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
    index("project_revisions_project_created_idx").on(table.projectId, table.createdAt.desc()),
  ],
);
