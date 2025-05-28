import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const dummy = pgTable("dummy", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});