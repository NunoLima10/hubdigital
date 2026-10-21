import { date, integer, pgTable, serial, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { projectLinks } from "./project-links";
export const projectLinkClicks = pgTable(
  "project_link_clicks",
  {
    id: serial("id").primaryKey(),
    linkId: integer("link_id")
      .notNull()
      .references(() => projectLinks.id, { onDelete: "cascade" }),
    day: date("day", { mode: "string" }).notNull(),
    surface: varchar("surface", { length: 16 }).$type<"detail" | "card" | "map">().notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [
    uniqueIndex("project_link_clicks_bucket_idx").on(table.linkId, table.day, table.surface),
  ],
);
