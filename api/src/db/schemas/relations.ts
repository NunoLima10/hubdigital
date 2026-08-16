import { relations } from "drizzle-orm";
import { users } from "./auth";
import { categories } from "./categories";
import { projects } from "./projects";
import { publishers } from "./publishers";

export const userRelations = relations(users, ({ one }) => ({
  publisher: one(publishers, {
    fields: [users.id],
    references: [publishers.userId],
  }),
}));

export const publisherRelations = relations(publishers, ({ one, many }) => ({
  user: one(users, {
    fields: [publishers.userId],
    references: [users.id],
  }),
  projects: many(projects),
}));

export const projectRelations = relations(projects, ({ one }) => ({
  category: one(categories, {
    fields: [projects.categoryId],
    references: [categories.id],
  }),
  publisher: one(publishers, {
    fields: [projects.publisherId],
    references: [publishers.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  projects: many(projects),
}));
