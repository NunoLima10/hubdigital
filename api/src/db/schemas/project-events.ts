import { projectEventSourceValues, projectEventTypeValues } from "@hubdigital/shared";
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  varchar,
} from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { timestamps } from "./timestamps";

export const projectEventTypeEnum = pgEnum(
  "project_event_type",
  projectEventTypeValues
);
export const projectEventSourceEnum = pgEnum(
  "project_event_source",
  projectEventSourceValues
);

/**
 * Daily counters, not an event log: one row per project, type, source and day,
 * incremented in place. A page view costs an upsert instead of a row, and the
 * table grows with days rather than with traffic.
 *
 * `day` is the Cabo Verde calendar day (see utils/day.ts), so a "day" here
 * matches the one makers actually lived, and lines up with the weekly cycle.
 */
export const projectEvents = pgTable(
  "project_events",
  {
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    type: projectEventTypeEnum("type").notNull(),
    source: projectEventSourceEnum("source").notNull().default("web"),
    day: date("day", { mode: "string" }).notNull(),
    count: integer("count").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    // One row per bucket, and the conflict target for the increment upsert.
    primaryKey({
      columns: [table.projectId, table.type, table.source, table.day],
    }),
    // The stats endpoint reads one project's rows across a range of days.
    index("project_events_project_day_idx").on(table.projectId, table.day),
  ]
);

/**
 * Who has already been counted today, so a refresh is not a second view. The
 * visitor is a keyed hash that changes every day (see visitorFingerprint):
 * no IP or user id is stored, and yesterday's rows cannot be linked to
 * today's. Only the current day matters, so older rows are pruned as new ones
 * arrive.
 */
export const projectEventVisitors = pgTable(
  "project_event_visitors",
  {
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    type: projectEventTypeEnum("type").notNull(),
    // Same buckets as the counters: a view in the app and one on the site are
    // two views, even from the same person.
    source: projectEventSourceEnum("source").notNull(),
    day: date("day", { mode: "string" }).notNull(),
    visitor: varchar("visitor", { length: 32 }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.projectId, table.type, table.source, table.day, table.visitor],
    }),
    index("project_event_visitors_day_idx").on(table.day),
  ]
);
