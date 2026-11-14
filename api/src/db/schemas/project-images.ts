import { integer, pgTable, serial, text, uniqueIndex } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { timestamps } from "./timestamps";

/** Ordered 16:9 media uploaded for a project's public gallery. */
export const projectImages = pgTable(
  "project_images",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    position: integer("position").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("project_images_project_position_idx").on(
      table.projectId,
      table.position,
    ),
    uniqueIndex("project_images_storage_key_idx").on(table.storageKey),
  ],
);
