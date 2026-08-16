import {
  accessValues,
  audienceValues,
  businessModelValues,
  platformValues,
  pricingValues,
  projectStageValues,
} from "@/utils/constants";
import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { publishers } from "./publishers";
import { timestamps } from "./timestamps";

export const pricingEnum = pgEnum("pricing", pricingValues);
export const platformEnum = pgEnum("platform", platformValues);
export const businessModelEnum = pgEnum("businessModel", businessModelValues);
export const accessEnum = pgEnum("access", accessValues);
export const projectStageEnum = pgEnum("projectStage", projectStageValues);
export const audienceStageEnum = pgEnum("audience", audienceValues);

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  publisherId: integer("publisher_id")
    .notNull()
    .references(() => publishers.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  slug: text("slug").notNull().unique(),
  shortDescription: varchar("short_description").notNull(),
  description: text("description"),
  websiteUrl: text("website_url").notNull(),
  logoUrl: text("logo_url"),
  bannerImageUrl: text("banner_image_url"),
  githubUrl: text("github_url"),
  pricing: pricingEnum("pricing").notNull(),
  platform: platformEnum("platform").array().notNull(),
  businessModel: businessModelEnum("businessModel").notNull(),
  access: accessEnum("access").notNull(),
  projectStage: projectStageEnum("projectStage").notNull(),
  audienceStage: audienceStageEnum("audience").notNull(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),

  ...timestamps,
});
