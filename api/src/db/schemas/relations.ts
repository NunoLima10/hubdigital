import { relations } from "drizzle-orm";
import { publishers } from "./publishers";
import { users } from "./auth";

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
