import { moderationTargetValues } from "@hubdigital/shared";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const moderationTargetEnum = pgEnum(
  "moderation_target",
  moderationTargetValues
);

/**
 * Append-only record of everything the staff does. There is no update or delete
 * path to this table anywhere in the API, by design.
 *
 * `actor_id` is nullable and detaches rather than cascades: if an account is
 * ever removed, the log has to survive it. `actor_email` is the snapshot that
 * keeps a detached row readable.
 *
 * `target_id` is a varchar because ids are mixed across the schema — serial on
 * projects and comments, text on users.
 */
export const moderationActions = pgTable(
  "moderation_actions",
  {
    id: serial("id").primaryKey(),
    actorId: text("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actorEmail: varchar("actor_email", { length: 255 }),
    action: varchar("action", { length: 64 }).notNull(),
    targetType: moderationTargetEnum("target_type").notNull(),
    targetId: varchar("target_id", { length: 64 }).notNull(),
    reason: text("reason"),
    /** Before/after for anything reversible, so an undo has something to read. */
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("moderation_actions_target_idx").on(
      table.targetType,
      table.targetId,
      table.createdAt.desc()
    ),
    index("moderation_actions_actor_idx").on(
      table.actorId,
      table.createdAt.desc()
    ),
    index("moderation_actions_created_idx").on(table.createdAt.desc()),
  ]
);
