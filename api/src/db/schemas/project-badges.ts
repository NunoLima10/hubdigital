import {
  index,
  integer,
  primaryKey,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { projects } from "./projects";

/**
 * Achievements a project holds. The catalog is `projectBadgeCatalog` in
 * @hubdigital/shared; the key is checked there rather than through a foreign
 * key, since nothing about a project badge is configurable at runtime.
 *
 * `period` makes the repeatable badges repeatable: one weekly plaque per week
 * (`2026-W46`), one project of the month per month (`2026-11`). Badges earned
 * once store an empty string, so the unique index also stops a duplicate of
 * those (a null would not, as nulls never collide).
 */
export const projectBadgeAwards = pgTable(
  "project_badge_awards",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    badgeKey: varchar("badge_key", { length: 40 }).notNull(),
    period: varchar("period", { length: 10 }).notNull().default(""),
    /** Closing place for weekly plaques, launch order for pioneer. */
    rank: integer("rank"),
    awardedAt: timestamp("awarded_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    /** The staff member who granted it; null for an automatic award. */
    awardedBy: text("awarded_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    uniqueIndex("project_badge_awards_unique_idx").on(
      table.projectId,
      table.badgeKey,
      table.period,
    ),
    // Who holds a badge in a given period (project of the month is one a month).
    index("project_badge_awards_key_period_idx").on(
      table.badgeKey,
      table.period,
    ),
  ],
);

/**
 * The frozen close of each weekly ranking. The public ranking keeps counting
 * upvotes after a week ends; this is the order as it stood at the close, the
 * source for weekly plaques and a project's best place. A week with rows here
 * has been closed and is never closed again.
 */
export const weeklyRankingResults = pgTable(
  "weekly_ranking_results",
  {
    weekId: varchar("week_id", { length: 8 }).notNull(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    rank: integer("rank").notNull(),
    upvotes: integer("upvotes").notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.weekId, table.projectId] }),
    index("weekly_ranking_results_project_idx").on(table.projectId),
  ],
);
