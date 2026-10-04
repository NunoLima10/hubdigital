import { errorResponseSchema, routeErrorResponses } from "@/shared/schemas";
import {
  myProjectStatsSchema,
  projectEventBodySchema,
  projectStatsSchema,
  statsRangeValues,
} from "@hubdigital/shared";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

const projectIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const statsQuerySchema = z.object({
  range: z.enum(statsRangeValues).default("30d"),
});

export const recordEventRouteSchema = {
  tags: ["project-stats"],
  params: projectIdParamsSchema,
  body: projectEventBodySchema,
  response: {
    // Always 204, even when the event was ignored (bot, the owner's own visit,
    // a project that is not public, an unknown id). The caller is fire-and-forget
    // and must not be able to tell those cases apart.
    204: z.null(),
    400: errorResponseSchema,
    500: errorResponseSchema,
  },
};

type RecordEventGeneric = {
  Params: z.infer<typeof recordEventRouteSchema.params>;
  Body: z.infer<typeof recordEventRouteSchema.body>;
};

export type RecordEventRequest = FastifyRequest<RecordEventGeneric>;
export type RecordEventReply = FastifyReply<RecordEventGeneric>;

export const getProjectStatsRouteSchema = {
  tags: ["project-stats"],
  params: projectIdParamsSchema,
  querystring: statsQuerySchema,
  response: {
    200: z.object({ data: projectStatsSchema }),
    403: errorResponseSchema,
    ...routeErrorResponses,
  },
};

type GetProjectStatsGeneric = {
  Params: z.infer<typeof getProjectStatsRouteSchema.params>;
  Querystring: z.infer<typeof getProjectStatsRouteSchema.querystring>;
};

export type GetProjectStatsRequest = FastifyRequest<GetProjectStatsGeneric>;
export type GetProjectStatsReply = FastifyReply<GetProjectStatsGeneric>;

export const getMyProjectStatsRouteSchema = {
  tags: ["project-stats"],
  querystring: statsQuerySchema,
  response: {
    200: z.object({ data: myProjectStatsSchema }),
    403: errorResponseSchema,
    ...routeErrorResponses,
  },
};

type GetMyProjectStatsGeneric = {
  Querystring: z.infer<typeof getMyProjectStatsRouteSchema.querystring>;
};

export type GetMyProjectStatsRequest = FastifyRequest<GetMyProjectStatsGeneric>;
export type GetMyProjectStatsReply = FastifyReply<GetMyProjectStatsGeneric>;
