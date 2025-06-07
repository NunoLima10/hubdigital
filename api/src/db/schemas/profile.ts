import {
  foundUsByQuestionValues,
  locationQuestionValues,
  objectiveQuestionValues,
  profileQuestionValues,
} from "@/utils/constants";
import { InferInsertModel } from "drizzle-orm";
import { pgEnum, pgTable, serial, varchar } from "drizzle-orm/pg-core";
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
  foundUsByQuestionValues
);

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  bio: varchar("bio").notNull(),
  profileResponse: profileResponseEnum("profile_response").notNull(),
  objectiveResponse: objectiveResponseEnum("objective_response").notNull(),
  locationResponse: locationResponseEnum("location_response").notNull(),
  foundUsByResponse: foundUsByResponseEnum("found_us_by_response").notNull(),
  ...timestamps,
});

export type ProfilInsertModel = InferInsertModel<typeof profiles>;
