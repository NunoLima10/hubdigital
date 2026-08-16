import { errorResponseSchema, routeErrorResponses } from "@/shared/schemas";
import {
  projectBodySchema,
  projectMinimalSchema,
  projectSchema,
} from "@hubdigital/shared";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export const createProjectRouteSchema = {
  tags: ["projects"],
  body: projectBodySchema,
  response: {
    201: z.object({
      data: z.object({
        id: z.number(),
        slug: z.string(),
      }),
    }),
    403: errorResponseSchema,
    ...routeErrorResponses,
  },
};

type CreateProjectGeneric = {
  Body: z.infer<typeof createProjectRouteSchema.body>;
};

export type CreateProjectRequest = FastifyRequest<CreateProjectGeneric>;
export type CreateProjectReply = FastifyReply<CreateProjectGeneric>;

export const updateProjectRouteSchema = {
  tags: ["projects"],
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: projectBodySchema.partial(),
  response: {
    200: z.object({
      data: z.object({
        id: z.number(),
        slug: z.string(),
      }),
    }),
    403: errorResponseSchema,
    ...routeErrorResponses,
  },
};

type UpdateProjectGeneric = {
  Params: z.infer<typeof updateProjectRouteSchema.params>;
  Body: z.infer<typeof updateProjectRouteSchema.body>;
};

export type UpdateProjectRequest = FastifyRequest<UpdateProjectGeneric>;
export type UpdateProjectReply = FastifyReply<UpdateProjectGeneric>;

const paginationMetaSchema = z.object({
  limit: z.number(),
  offset: z.number(),
  total: z.number(),
});

const paginatedProjectsResponseSchema = z.object({
  data: z.array(projectSchema),
  meta: paginationMetaSchema,
});

const paginatedProjectsMinimalResponseSchema = z.object({
  data: z.array(projectMinimalSchema),
  meta: paginationMetaSchema,
});

const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const listMyProjectsRouteSchema = {
  tags: ["projects"],
  querystring: paginationQuerySchema,
  response: {
    200: paginatedProjectsResponseSchema,
    403: errorResponseSchema,
    ...routeErrorResponses,
  },
};

type ListMyProjectsGeneric = {
  Querystring: z.infer<typeof listMyProjectsRouteSchema.querystring>;
};

export type ListMyProjectsRequest = FastifyRequest<ListMyProjectsGeneric>;
export type ListMyProjectsReply = FastifyReply<ListMyProjectsGeneric>;

export const listProjectsRouteSchema = {
  tags: ["projects"],
  querystring: paginationQuerySchema,
  response: {
    200: paginatedProjectsMinimalResponseSchema,
    ...routeErrorResponses,
  },
};

type ListProjectsGeneric = {
  Querystring: z.infer<typeof listProjectsRouteSchema.querystring>;
};

export type ListProjectsRequest = FastifyRequest<ListProjectsGeneric>;
export type ListProjectsReply = FastifyReply<ListProjectsGeneric>;
