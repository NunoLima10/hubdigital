import { relations } from "drizzle-orm";
import { users } from "./auth";
import { categories } from "./categories";
import { comments } from "./comments";
import { moderationActions } from "./moderation-actions";
import { projectUpvotes } from "./project-upvotes";
import { projects } from "./projects";
import { publishers } from "./publishers";
import { reports } from "./reports";

export const userRelations = relations(users, ({ one, many }) => ({
  publisher: one(publishers, {
    fields: [users.id],
    references: [publishers.userId],
  }),
  upvotes: many(projectUpvotes),
  comments: many(comments),
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
  comments: many(comments),
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

export const moderationActionRelations = relations(
  moderationActions,
  ({ one }) => ({
    actor: one(users, {
      fields: [moderationActions.actorId],
      references: [users.id],
    }),
  })
);

export const reportRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
  }),
  resolver: one(users, {
    fields: [reports.resolvedBy],
    references: [users.id],
    relationName: "reportResolver",
  }),
}));

export const commentRelations = relations(comments, ({ one, many }) => ({
  project: one(projects, {
    fields: [comments.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "commentReplies",
  }),
  replies: many(comments, { relationName: "commentReplies" }),
}));
