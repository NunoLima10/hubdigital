import { errorResponseSchema, routeErrorResponses } from "@/shared/schemas";
import {
  makerProfileSchema,
  makerProfileUpdateSchema,
} from "@hubdigital/shared";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

const handleParamsSchema = z.object({ handle: z.string() });

export const getMakerRouteSchema = {
  tags: ["makers"],
  params: handleParamsSchema,
  response: {
    200: z.object({ data: makerProfileSchema }),
    ...routeErrorResponses,
  },
};

type GetMakerGeneric = { Params: z.infer<typeof handleParamsSchema> };

export type GetMakerRequest = FastifyRequest<GetMakerGeneric>;
export type GetMakerReply = FastifyReply<GetMakerGeneric>;

export const updateMakerRouteSchema = {
  tags: ["makers"],
  body: makerProfileUpdateSchema,
  response: {
    200: z.object({ data: z.object({ handle: z.string().nullable() }) }),
    403: errorResponseSchema,
    ...routeErrorResponses,
  },
};

type UpdateMakerGeneric = { Body: z.infer<typeof makerProfileUpdateSchema> };

export type UpdateMakerRequest = FastifyRequest<UpdateMakerGeneric>;
export type UpdateMakerReply = FastifyReply<UpdateMakerGeneric>;

export const getMyHandleRouteSchema = {
  tags: ["makers"],
  response: {
    200: z.object({ data: z.object({ handle: z.string().nullable() }) }),
    ...routeErrorResponses,
  },
};
