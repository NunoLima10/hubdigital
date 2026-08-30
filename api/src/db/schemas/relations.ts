import { relations } from "drizzle-orm";
import { users } from "./auth";
import { categories } from "./categories";
import { projectUpvotes } from "./project-upvotes";
import { projects } from "./projects";
import { publishers } from "./publishers";

export const userRelations = relations(users, ({ one, many }) => ({
  publisher: one(publishers, {
    fields: [users.id],
    references: [publishers.userId],
  }),
  upvotes: many(projectUpvotes),
}));

export const publisherRelations = relations(publishers, ({ one, many }) => ({
  user: one(users, {
    fields: [publishers.userId],
    references: [users.id],
  }),
  projects: many(projects),
}));

export const projectRelations = relations(projects, ({ one, many }) => ({
  category: one(categories, {
    fields: [projects.categoryId],
    references: [categories.id],
  }),
  publisher: one(publishers, {
    fields: [projects.publisherId],
    references: [publishers.id],
  }),
  upvotes: many(projectUpvotes),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  projects: many(projects),
}));

export const projectUpvoteRelations = relations(projectUpvotes, ({ one }) => ({
  project: one(projects, {
    fields: [projectUpvotes.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectUpvotes.userId],
    references: [users.id],
  }),
}));
