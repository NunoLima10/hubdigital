import { pgTable, text } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  clerk_user_id: text("clerk_user_id").notNull(),
  email: text("email").notNull(),
  fullName: text("fullName").notNull(),
  username: text("username").notNull(),
  imageUrl: text("imageUrl"),
  ...timestamps,
});
