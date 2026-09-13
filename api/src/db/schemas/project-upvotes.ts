import {
  integer,
  pgTable,
  serial,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { projects } from "./projects";
import { timestamps } from "./timestamps";

export const projectUpvotes = pgTable(
  "project_upvotes",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Recorded so a burst of votes from one place can be traced after the fact.
    // The unique index below is what actually stops double voting.
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("project_upvotes_project_user_idx").on(
      table.projectId,
      table.userId
    ),
  ]
);
