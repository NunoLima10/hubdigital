import { errorResponseSchema, routeErrorResponses } from "@/shared/schemas";
import {
  commentBodySchema,
  commentSchema,
  commentUpdateSchema,
} from "@hubdigital/shared";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

const slugParamsSchema = z.object({ slug: z.string() });
const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listCommentsRouteSchema = {
  tags: ["comments"],
  params: slugParamsSchema,
  response: {
    200: z.object({ data: z.array(commentSchema) }),
    ...routeErrorResponses,
  },
};

type ListCommentsGeneric = { Params: z.infer<typeof slugParamsSchema> };

export type ListCommentsRequest = FastifyRequest<ListCommentsGeneric>;
export type ListCommentsReply = FastifyReply<ListCommentsGeneric>;

export const createCommentRouteSchema = {
  tags: ["comments"],
  params: slugParamsSchema,
  body: commentBodySchema,
  response: {
    201: z.object({ data: commentSchema }),
    403: errorResponseSchema,
    ...routeErrorResponses,
  },
};

type CreateCommentGeneric = {
  Params: z.infer<typeof slugParamsSchema>;
  Body: z.infer<typeof commentBodySchema>;
};

export type CreateCommentRequest = FastifyRequest<CreateCommentGeneric>;
export type CreateCommentReply = FastifyReply<CreateCommentGeneric>;

export const updateCommentRouteSchema = {
  tags: ["comments"],
  params: idParamsSchema,
  body: commentUpdateSchema,
  response: {
    200: z.object({ data: commentSchema }),
    403: errorResponseSchema,
    ...routeErrorResponses,
  },
};

type UpdateCommentGeneric = {
  Params: z.infer<typeof idParamsSchema>;
  Body: z.infer<typeof commentUpdateSchema>;
};

export type UpdateCommentRequest = FastifyRequest<UpdateCommentGeneric>;
export type UpdateCommentReply = FastifyReply<UpdateCommentGeneric>;

export const deleteCommentRouteSchema = {
  tags: ["comments"],
  params: idParamsSchema,
  response: {
    204: z.null(),
    403: errorResponseSchema,
    ...routeErrorResponses,
  },
};

type DeleteCommentGeneric = { Params: z.infer<typeof idParamsSchema> };

export type DeleteCommentRequest = FastifyRequest<DeleteCommentGeneric>;
export type DeleteCommentReply = FastifyReply<DeleteCommentGeneric>;
