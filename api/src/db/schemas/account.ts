import { relations } from "drizzle-orm";
import { integer, pgTable, text , serial} from "drizzle-orm/pg-core";
import { profiles } from "./profile";
import { timestamps } from "./timestamps";

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  clerk_user_id: text("clerk_user_id").notNull(),
  profileId: integer("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  fullName: text("fullName").notNull(),
  username: text("username").notNull(),
  avatarUrl: text("avatar_url"),
  ...timestamps,
});

export const profilesRelations = relations(accounts, ({ one }) => ({
  profile: one(profiles, {
    fields: [accounts.profileId],
    references: [profiles.id],
  }),
}));
