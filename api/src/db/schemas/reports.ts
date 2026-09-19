import {
  reportReasonValues,
  reportStatusValues,
  reportTargetValues,
} from "@hubdigital/shared";
import {
  index,
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

export const reportTargetEnum = pgEnum("report_target", reportTargetValues);
export const reportReasonEnum = pgEnum("report_reason", reportReasonValues);
export const reportStatusEnum = pgEnum("report_status", reportStatusValues);

/**
 * What visitors flag for staff attention. The unique index is what stops one
 * account reporting the same thing repeatedly to inflate its count — the admin
 * inbox sorts by that count, so it has to mean something.
 */
export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: reportTargetEnum("target_type").notNull(),
    targetId: varchar("target_id", { length: 64 }).notNull(),
    reason: reportReasonEnum("reason").notNull(),
    details: text("details"),
    status: reportStatusEnum("status").notNull().default("open"),
    resolvedBy: text("resolved_by").references(() => users.id, {
      onDelete: "set null",
    }),
    resolvedAt: timestamp("resolved_at", {
      withTimezone: true,
      mode: "string",
    }),
    resolutionNote: text("resolution_note"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("reports_reporter_target_idx").on(
      table.reporterId,
      table.targetType,
      table.targetId
    ),
    index("reports_target_idx").on(table.targetType, table.targetId),
    index("reports_status_idx").on(table.status, table.createdAt),
  ]
);
