import {
  locationQuestionValues,
  objectiveQuestionValues,
  profileQuestionValues,
} from "@/utils/constants";
import { pgEnum, pgTable, serial, text } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";

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
  locationQuestionValues
);

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  bio: text("bio"),
  profileResponse: profileResponseEnum("profile_response").notNull(),
  objectiveResponse: objectiveResponseEnum("objective_response").notNull(),
  locationResponse: locationResponseEnum("location_response").notNull(),
  foundUsByResponse: foundUsByResponseEnum("found_us_by_response").notNull(),
  ...timestamps,
});
