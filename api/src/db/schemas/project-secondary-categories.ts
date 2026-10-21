import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { projects } from "./projects";

// The primary category lives on projects; these ordered memberships add up to
// two other discovery sectors without duplicating the primary selection.
// The cross-table primary invariant is enforced by deferred constraint triggers
// in migration 0021, so primary swaps can complete inside one transaction.
export const projectSecondaryCategories = pgTable("project_secondary_categories", {
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
  position: integer("position").notNull(),
}, (table) => [
  primaryKey({ columns: [table.projectId, table.categoryId] }),
  uniqueIndex("project_secondary_categories_position_idx").on(table.projectId, table.position),
  index("project_secondary_categories_category_idx").on(table.categoryId, table.projectId),
  check("project_secondary_categories_position_check", sql`${table.position} in (0, 1)`),
]);
