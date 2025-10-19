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

export const publisherRelations = relations(publishers, ({ one }) => ({
  user: one(users, {
    fields: [publishers.userId],
    references: [users.id],
  }),
}));

export const projectRelations = relations(projects, ({ one }) => ({
  category: one(categories, {
    fields: [projects.categoryId],
    references: [categories.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one }) => ({
  project: one(projects, {
    fields: [categories.id],
    references: [projects.categoryId],
  }),
}));
