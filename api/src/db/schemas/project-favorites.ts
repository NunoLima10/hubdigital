import { index, integer, pgTable, serial, text, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { projects } from "./projects";
import { timestamps } from "./timestamps";

export const projectFavorites = pgTable(
  "project_favorites",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("project_favorites_project_user_idx").on(
      table.projectId,
      table.userId,
    ),
    // A visitor's saved list, newest first.
    index("project_favorites_user_created_idx").on(table.userId, table.createdAt.desc()),
  ],
);
