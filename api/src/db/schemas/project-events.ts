import { projectEventSourceValues, projectEventTypeValues } from "@/utils/constants";
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  uniqueIndex,
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
    id: serial("id").primaryKey(),
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
    // The conflict target for the increment upsert.
    uniqueIndex("project_events_bucket_idx").on(
      table.projectId,
      table.type,
      table.source,
      table.day
    ),
    // The stats endpoint reads one project's rows across a range of days.
    index("project_events_project_day_idx").on(table.projectId, table.day),
  ]
);
