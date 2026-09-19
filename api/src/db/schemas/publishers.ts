import {
  foundUsByQuestionValues,
  locationQuestionValues,
  objectiveQuestionValues,
  profileQuestionValues,
} from "@/utils/constants";
import { InferInsertModel } from "drizzle-orm";
import { pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";
import { users } from "./auth";
import { uniqueIndex } from "drizzle-orm/pg-core";

export const profileResponseEnum = pgEnum(
  "profile_responses",
  profileQuestionValues
);
export const objectiveResponseEnum = pgEnum(
  "objective_responses",
  objectiveQuestionValues
);
export const locationResponseEnum = pgEnum(
  "location_responses",
  locationQuestionValues
);
export const foundUsByResponseEnum = pgEnum(
  "found_us_by_responses",
  foundUsByQuestionValues
);

export const publishers = pgTable("publishers", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Public identifier for the maker's profile page (/makers/:handle). Nullable
  // only so the column could be added to existing rows; every row is backfilled
  // and every new publisher gets one at onboarding.
  handle: varchar("handle"),
  bio: varchar("bio").notNull(),
  websiteUrl: text("website_url"),
  githubUrl: text("github_url"),
  linkedinUrl: text("linkedin_url"),
  profileResponse: profileResponseEnum("profile_response").notNull(),
  objectiveResponse: objectiveResponseEnum("objective_response").notNull(),
  locationResponse: locationResponseEnum("location_response").notNull(),
  foundUsByResponse: foundUsByResponseEnum("found_us_by_response").notNull(),
  // A maker staff has vouched for: their publishes skip the review queue while
  // `moderation.auto_approve_trusted` is on.
  trustedAt: timestamp("trusted_at", { withTimezone: true, mode: "string" }),
  ...timestamps,
}, (table) => [
  uniqueIndex('publisher_user_idx').on(table.userId),
  uniqueIndex('publisher_handle_idx').on(table.handle)
]);

export type PublisherInsertModel = InferInsertModel<typeof publishers>;
