import { badgeAwardModeValues } from "@hubdigital/shared";
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { timestamps } from "./timestamps";

export const badgeAwardModeEnum = pgEnum(
  "badge_award_mode",
  badgeAwardModeValues
);

/**
 * The catalog, mirrored from `badgeCatalog` in @hubdigital/shared by the seed.
 * Names and art live in code; the table exists so awards can point at a badge
 * that is known to exist, and so the award rule is enforceable server side.
 */
export const badges = pgTable("badges", {
  key: varchar("key", { length: 40 }).primaryKey(),
  awardMode: badgeAwardModeEnum("award_mode").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

/**
 * Who holds which badge. A user holds each badge at most once and features at
 * most one of them (the partial unique index), which is the one shown next to
 * their name on the profile and in comments.
 */
export const userBadges = pgTable(
  "user_badges",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeKey: varchar("badge_key", { length: 40 })
      .notNull()
      .references(() => badges.key, { onDelete: "cascade" }),
    awardedAt: timestamp("awarded_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    /** The staff member who granted it; null for an automatic award. */
    awardedBy: text("awarded_by").references(() => users.id, {
      onDelete: "set null",
    }),
    featured: boolean("featured").notNull().default(false),
    /** When the user was shown the "you earned a badge" moment. */
    seenAt: timestamp("seen_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    uniqueIndex("user_badges_user_badge_idx").on(table.userId, table.badgeKey),
    uniqueIndex("user_badges_featured_idx")
      .on(table.userId)
      .where(sql`${table.featured}`),
    index("user_badges_badge_idx").on(table.badgeKey),
  ]
);
