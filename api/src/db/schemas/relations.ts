import { relations } from "drizzle-orm";
import { users } from "./auth";
import { categories } from "./categories";
import { comments } from "./comments";
import { moderationActions } from "./moderation-actions";
import { projectEvents } from "./project-events";
import { projectFavorites } from "./project-favorites";
import { projectImages } from "./project-images";
import { projectSecondaryCategories } from "./project-secondary-categories";
import { projectLinks } from "./project-links";
import { projectUpvotes } from "./project-upvotes";
import {
  announcementVotes,
  projectAnnouncements,
  projectMakers,
  projectRevisions,
} from "./project-community";
import { projectLinkClicks } from "./project-link-clicks";
import { fileUploads } from "./uploads";
import { projects } from "./projects";
import { publishers } from "./publishers";
import { reports } from "./reports";

export const userRelations = relations(users, ({ one, many }) => ({
  publisher: one(publishers, {
    fields: [users.id],
    references: [publishers.userId],
  }),
  upvotes: many(projectUpvotes),
  favorites: many(projectFavorites),
  comments: many(comments),
  uploads: many(fileUploads),
  makerMemberships: many(projectMakers, { relationName: "makerMember" }),
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
  events: many(projectEvents),
  favorites: many(projectFavorites),
  images: many(projectImages),
  links: many(projectLinks),
  secondaryMemberships: many(projectSecondaryCategories),
  announcements: many(projectAnnouncements),
  makers: many(projectMakers),
  revisions: many(projectRevisions),
}));

export const projectSecondaryCategoryRelations = relations(projectSecondaryCategories, ({ one }) => ({
  project: one(projects, { fields: [projectSecondaryCategories.projectId], references: [projects.id] }),
  category: one(categories, { fields: [projectSecondaryCategories.categoryId], references: [categories.id] }),
}));

export const projectLinkRelations = relations(projectLinks, ({ one, many }) => ({
  project: one(projects, { fields: [projectLinks.projectId], references: [projects.id] }),
  clicks: many(projectLinkClicks),
}));

export const projectLinkClickRelations = relations(projectLinkClicks, ({ one }) => ({
  link: one(projectLinks, { fields: [projectLinkClicks.linkId], references: [projectLinks.id] }),
}));

export const projectAnnouncementRelations = relations(projectAnnouncements, ({ one, many }) => ({
  project: one(projects, { fields: [projectAnnouncements.projectId], references: [projects.id] }),
  votes: many(announcementVotes),
}));

export const announcementVoteRelations = relations(announcementVotes, ({ one }) => ({
  announcement: one(projectAnnouncements, {
    fields: [announcementVotes.announcementId],
    references: [projectAnnouncements.id],
  }),
  user: one(users, { fields: [announcementVotes.userId], references: [users.id] }),
}));

export const projectMakerRelations = relations(projectMakers, ({ one }) => ({
  project: one(projects, { fields: [projectMakers.projectId], references: [projects.id] }),
  user: one(users, {
    fields: [projectMakers.userId],
    references: [users.id],
    relationName: "makerMember",
  }),
}));

export const projectRevisionRelations = relations(projectRevisions, ({ one }) => ({
  project: one(projects, { fields: [projectRevisions.projectId], references: [projects.id] }),
}));

export const fileUploadRelations = relations(fileUploads, ({ one }) => ({
  user: one(users, { fields: [fileUploads.userId], references: [users.id] }),
}));

export const projectImageRelations = relations(projectImages, ({ one }) => ({
  project: one(projects, {
    fields: [projectImages.projectId],
    references: [projects.id],
  }),
}));

export const projectEventRelations = relations(projectEvents, ({ one }) => ({
  project: one(projects, {
    fields: [projectEvents.projectId],
    references: [projects.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  projects: many(projects),
  secondaryMemberships: many(projectSecondaryCategories),
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

export const projectFavoriteRelations = relations(
  projectFavorites,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectFavorites.projectId],
      references: [projects.id],
    }),
    user: one(users, {
      fields: [projectFavorites.userId],
      references: [users.id],
    }),
  }),
);

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
