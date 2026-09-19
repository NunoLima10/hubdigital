import { errorResponseSchema, routeErrorResponses } from "@/shared/schemas";
import {
  WEEK_ID_PATTERN,
  islandValues,
  listPeriodValues,
  listSortValues,
  platformValues,
  pricingValues,
  projectStageValues,
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
    // Submissions can be closed from the admin settings page.
    503: errorResponseSchema,
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

const listProjectsQuerySchema = paginationQuerySchema.extend({
  period: z.enum(listPeriodValues).default("this_week"),
  sort: z.enum(listSortValues).default("upvotes"),
  q: z.string().trim().min(1).max(120).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  island: z.enum(islandValues).optional(),
  pricing: z.enum(pricingValues).optional(),
  projectStage: z.enum(projectStageValues).optional(),
  // Repeatable query parameter: ?platform=web&platform=mobile
  platform: z
    .union([z.enum(platformValues), z.array(z.enum(platformValues))])
    .transform((value) => (Array.isArray(value) ? value : [value]))
    .optional(),
});

const leaderboardQuerySchema = paginationQuerySchema.extend({
  week: z
    .string()
    .regex(WEEK_ID_PATTERN, "Semana inválida. Use o formato AAAA-Wss.")
    .optional(),
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

const weekMetaSchema = z.object({
  limit: z.number(),
  offset: z.number(),
  total: z.number(),
  week: z.string().nullable(),
});

export const listProjectsRouteSchema = {
  tags: ["projects"],
  querystring: listProjectsQuerySchema,
  response: {
    200: z.object({
      data: z.array(projectMinimalSchema),
      meta: weekMetaSchema,
    }),
    ...routeErrorResponses,
  },
};

export const leaderboardRouteSchema = {
  tags: ["projects"],
  querystring: leaderboardQuerySchema,
  response: {
    200: z.object({
      data: z.array(projectMinimalSchema),
      meta: weekMetaSchema,
    }),
    ...routeErrorResponses,
  },
};

type LeaderboardGeneric = {
  Querystring: z.infer<typeof leaderboardQuerySchema>;
};

export type LeaderboardRequest = FastifyRequest<LeaderboardGeneric>;
export type LeaderboardReply = FastifyReply<LeaderboardGeneric>;

export const publishProjectRouteSchema = {
  tags: ["projects"],
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  response: {
    200: z.object({
      data: z.object({
        id: z.number(),
        slug: z.string(),
        status: z.string(),
      }),
    }),
    403: errorResponseSchema,
    ...routeErrorResponses,
  },
};

type PublishProjectGeneric = {
  Params: z.infer<typeof publishProjectRouteSchema.params>;
};

export type PublishProjectRequest = FastifyRequest<PublishProjectGeneric>;
export type PublishProjectReply = FastifyReply<PublishProjectGeneric>;

export const deleteProjectRouteSchema = {
  tags: ["projects"],
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  response: {
    204: z.null(),
    403: errorResponseSchema,
    ...routeErrorResponses,
  },
};

type DeleteProjectGeneric = {
  Params: z.infer<typeof deleteProjectRouteSchema.params>;
};

export type DeleteProjectRequest = FastifyRequest<DeleteProjectGeneric>;
export type DeleteProjectReply = FastifyReply<DeleteProjectGeneric>;

type ListProjectsGeneric = {
  Querystring: z.infer<typeof listProjectsQuerySchema>;
};

export type ListProjectsRequest = FastifyRequest<ListProjectsGeneric>;
export type ListProjectsReply = FastifyReply<ListProjectsGeneric>;

export const getProjectRouteSchema = {
  tags: ["projects"],
  params: z.object({
    slug: z.string(),
  }),
  response: {
    200: z.object({
      data: projectSchema,
    }),
    ...routeErrorResponses,
  },
};

type GetProjectGeneric = {
  Params: z.infer<typeof getProjectRouteSchema.params>;
};

export type GetProjectRequest = FastifyRequest<GetProjectGeneric>;
export type GetProjectReply = FastifyReply<GetProjectGeneric>;

export const toggleUpvoteRouteSchema = {
  tags: ["projects"],
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  response: {
    200: z.object({
      data: z.object({
        upvoted: z.boolean(),
        upvoteCount: z.number(),
      }),
    }),
    ...routeErrorResponses,
  },
};

type ToggleUpvoteGeneric = {
  Params: z.infer<typeof toggleUpvoteRouteSchema.params>;
};

export type ToggleUpvoteRequest = FastifyRequest<ToggleUpvoteGeneric>;
export type ToggleUpvoteReply = FastifyReply<ToggleUpvoteGeneric>;
