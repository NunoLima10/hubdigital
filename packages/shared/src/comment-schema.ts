import { z } from "zod";
import { projectAuthorSchema } from "./project-schema.js";

export const COMMENT_MAX_LENGTH = 2000;

export const commentBodySchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Escreve alguma coisa antes de enviar.")
    .max(COMMENT_MAX_LENGTH, "O comentário é demasiado longo."),
  /** Set to reply to a top-level comment; replies never nest further. */
  parentId: z.number().int().positive().nullish(),
});

export const commentUpdateSchema = commentBodySchema.pick({ body: true });

const commentBaseSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  parentId: z.number().nullable(),
  body: z.string(),
  author: projectAuthorSchema.nullable(),
  /** True when the signed-in user wrote it, so the UI can offer edit/delete. */
  isOwn: z.boolean(),
  isDeleted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const commentSchema = commentBaseSchema.extend({
  replies: z.array(commentBaseSchema),
});

export type CommentBody = z.infer<typeof commentBodySchema>;
export type CommentUpdate = z.infer<typeof commentUpdateSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type CommentReply = z.infer<typeof commentBaseSchema>;
