import {
  availabilityValues,
  sourceModelValues,
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
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { categories } from "./categories";
import { publishers } from "./publishers";
import { timestamps } from "./timestamps";

export const pricingEnum = pgEnum("pricing", pricingValues);
export const platformEnum = pgEnum("platform", platformValues);
export const businessModelEnum = pgEnum("businessModel", businessModelValues);
export const availabilityEnum = pgEnum("availability", availabilityValues);
export const sourceModelEnum = pgEnum("source_model", sourceModelValues);
export const projectStageEnum = pgEnum("projectStage", projectStageValues);
export const audienceEnum = pgEnum("audience", audienceValues);
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
    shortDescription: varchar("short_description").notNull().default(""),
    description: text("description"),
    rowVersion: integer("row_version").notNull().default(0),
    creationKey: varchar("creation_key", { length: 36 }),
    logoUrl: text("logo_url"),
    youtubeVideoId: varchar("youtube_video_id", { length: 11 }),
    youtubeVideoUrl: text("youtube_video_url"),
    pricing: pricingEnum("pricing"),
    platform: platformEnum("platform").array().notNull().default([]),
    businessModel: businessModelEnum("businessModel"),
    availability: availabilityEnum("availability"),
    sourceModel: sourceModelEnum("source_model"),
    licenseId: varchar("license_id", { length: 80 }),
    projectStage: projectStageEnum("projectStage"),
    audiences: audienceEnum("audiences").array().notNull().default([]),
    // Primary public team base. Optional details and up to four further bases
    // keep distributed teams distinct from the countries the project serves.
    country: varchar("country", { length: 2 }),
    locationDetails: jsonb("location_details")
      .$type<Pick<import("@hubdigital/shared").ProjectLocation, "locality" | "publicPin">>()
      .notNull()
      .default({}),
    additionalLocations: jsonb("additional_locations")
      .$type<import("@hubdigital/shared").ProjectLocation[]>()
      .notNull()
      .default([]),
    teamMode: varchar("team_mode", { length: 16 }).$type<"local" | "distributed">(),
    localConnections: jsonb("local_connections")
      .$type<import("@hubdigital/shared").Project["localConnections"]>()
      .notNull()
      .default([]),
    serviceArea: jsonb("service_area").$type<import("@hubdigital/shared").Project["serviceArea"]>(),
    island: islandEnum("island"),
    municipality: varchar("municipality", { length: 5 }),
    zone: varchar("zone", { length: 13 }),
    languages: jsonb("languages").$type<string[]>().notNull().default([]),
    helpWanted: jsonb("help_wanted")
      .$type<import("@hubdigital/shared").Project["helpWanted"]>()
      .notNull()
      .default([]),
    helpDescription: varchar("help_description", { length: 500 }),
    teamDescription: varchar("team_description", { length: 500 }),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "restrict" }),

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
    uniqueIndex("projects_publisher_creation_key_idx").on(table.publisherId, table.creationKey),
    index("projects_launched_at_idx").on(table.launchedAt.desc(), table.id),
    index("projects_status_idx").on(table.status),
    index("projects_country_idx").on(table.country),
    index("projects_island_idx").on(table.island),
    // The review queue is ordered by how long something has been waiting.
    index("projects_status_queued_idx").on(table.status, table.queuedAt),
    index("projects_shadow_banned_idx")
      .on(table.shadowBannedAt)
      .where(sql`${table.shadowBannedAt} is not null`),
  ],
);
