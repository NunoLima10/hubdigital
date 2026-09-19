import {
  AnyPgColumn,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { projects } from "./projects";
import { timestamps } from "./timestamps";

export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // A single reply level: replies point at a top-level comment and never at
    // each other, which keeps the thread readable without recursive queries.
    parentId: integer("parent_id").references((): AnyPgColumn => comments.id, {
      onDelete: "cascade",
    }),
    body: text("body").notNull(),
    // Soft delete so a removed parent doesn't take its replies with it.
    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
      mode: "string",
    }),
    // Staff moderation, and deliberately not the same thing as deletedAt: a
    // hidden comment keeps its body for review and can be restored exactly,
    // where a deleted one is a tombstone (specs/ADMIN.md §A5).
    hiddenAt: timestamp("hidden_at", { withTimezone: true, mode: "string" }),
    hiddenBy: text("hidden_by").references(() => users.id, {
      onDelete: "set null",
    }),
    moderationReason: text("moderation_reason"),
    ...timestamps,
  },
  (table) => [
    index("comments_project_created_idx").on(table.projectId, table.createdAt),
    index("comments_parent_idx").on(table.parentId),
  ]
);
