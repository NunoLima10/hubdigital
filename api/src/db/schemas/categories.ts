import { pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  key: varchar("key").notNull().unique(),
  name: varchar("name").notNull(),
  ...timestamps,
});
