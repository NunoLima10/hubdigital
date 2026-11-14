import { linkClickSurfaceValues } from "@hubdigital/shared";
import { date, integer, pgEnum, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { projectLinks } from "./project-links";

export const linkClickSurfaceEnum = pgEnum("link_click_surface", linkClickSurfaceValues);

/** Daily click counters per link and surface, incremented in place. */
export const projectLinkClicks = pgTable(
  "project_link_clicks",
  {
    linkId: integer("link_id")
      .notNull()
      .references(() => projectLinks.id, { onDelete: "cascade" }),
    day: date("day", { mode: "string" }).notNull(),
    surface: linkClickSurfaceEnum("surface").notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.linkId, table.day, table.surface] })],
);
