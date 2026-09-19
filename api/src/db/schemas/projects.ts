import {
  accessValues,
  audienceValues,
  businessModelValues,
  islandValues,
  platformValues,
  pricingValues,
  projectStageValues,
  projectStatusValues,
} from "@/utils/constants";
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { categories } from "./categories";
import { publishers } from "./publishers";
import { timestamps } from "./timestamps";

export const pricingEnum = pgEnum("pricing", pricingValues);
export const platformEnum = pgEnum("platform", platformValues);
export const businessModelEnum = pgEnum("businessModel", businessModelValues);
export const accessEnum = pgEnum("access", accessValues);
export const projectStageEnum = pgEnum("projectStage", projectStageValues);
export const audienceStageEnum = pgEnum("audience", audienceValues);
export const projectStatusEnum = pgEnum("project_status", projectStatusValues);
export const islandEnum = pgEnum("island", islandValues);

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    publisherId: integer("publisher_id")
      .notNull()
      .references(() => publishers.id, { onDelete: "cascade" }),
    name: varchar("name").notNull(),
    slug: text("slug").notNull().unique(),
    shortDescription: varchar("short_description").notNull(),
    description: text("description"),
    websiteUrl: text("website_url").notNull(),
    logoUrl: text("logo_url"),
    bannerImageUrl: text("banner_image_url"),
    githubUrl: text("github_url"),
    pricing: pricingEnum("pricing").notNull(),
    platform: platformEnum("platform").array().notNull(),
    businessModel: businessModelEnum("businessModel").notNull(),
    access: accessEnum("access").notNull(),
    projectStage: projectStageEnum("projectStage").notNull(),
    audienceStage: audienceStageEnum("audience").notNull(),
    // Where the project is built from — the local answer to Product Hunt topics.
    // Nullable because projects that predate the field have no truthful value;
    // new submissions are required to pick one.
    island: islandEnum("island"),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),

    status: projectStatusEnum("status").notNull().default("draft"),

    // Review gate (specs/ADMIN.md §A3). All nullable: a project published
    // before the gate existed, or while it was off, was never reviewed and
    // should not pretend otherwise.
    queuedAt: timestamp("queued_at", { withTimezone: true, mode: "string" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "string" }),
    reviewedBy: text("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    rejectionReason: text("rejection_reason"),

    // Hidden from the public but visible to its owner, who is shown the reason
    // (specs/ADMIN.md §A4). Distinct from deleted_at, which hides it from
    // everyone including the owner.
    shadowBannedAt: timestamp("shadow_banned_at", {
      withTimezone: true,
      mode: "string",
    }),
    shadowBannedBy: text("shadow_banned_by").references(() => users.id, {
      onDelete: "set null",
    }),
    shadowBanReason: text("shadow_ban_reason"),

    publishedAt: timestamp("published_at", { withTimezone: true, mode: "string" }),
    // The moment the project entered a weekly ranking window. Separate from
    // published_at so a launch can later be scheduled for a future week without
    // changing when the record went live.
    launchedAt: timestamp("launched_at", { withTimezone: true, mode: "string" }),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),

    ...timestamps,
  },
  (table) => [
    index("projects_launched_at_idx").on(table.launchedAt.desc(), table.id),
    index("projects_status_idx").on(table.status),
    index("projects_island_idx").on(table.island),
    // The review queue is ordered by how long something has been waiting.
    index("projects_status_queued_idx").on(table.status, table.queuedAt),
    index("projects_shadow_banned_idx")
      .on(table.shadowBannedAt)
      .where(sql`${table.shadowBannedAt} is not null`),
  ]
);
