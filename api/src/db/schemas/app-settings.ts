import { jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Runtime platform configuration, keyed by dotted name (`moderation.review_required`).
 *
 * Key/value rather than one wide row: adding a flag is an insert, not a
 * migration. Values are `jsonb` but never free-form — `settings-schemas.ts`
 * holds a Zod validator per key, and a key absent from the table falls back to
 * the default declared there, so an empty table behaves exactly like the
 * pre-settings code did.
 */
export const appSettings = pgTable("app_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: jsonb("value").notNull(),
  updatedBy: text("updated_by").references(() => users.id, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});
