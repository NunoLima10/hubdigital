import { errorResponseSchema, routeErrorResponses } from "@/shared/schemas";
import {
  makerProfileSchema,
  makerProfileUpdateSchema,
  foundingMakerSchema,
  foundUsByQuestionValues,
  locationQuestionValues,
  objectiveQuestionValues,
  profileQuestionValues,
} from "@hubdigital/shared";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { abroadCountryValues } from "@hubdigital/shared";

const handleParamsSchema = z.object({ handle: z.string() });

const foundingMakersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

export const getFoundingMakersRouteSchema = {
  tags: ["makers"],
  querystring: foundingMakersQuerySchema,
  response: {
    200: z.object({
      data: z.array(foundingMakerSchema),
      meta: z.object({
        limit: z.number(),
        offset: z.number(),
        total: z.number(),
      }),
    }),
    ...routeErrorResponses,
  },
};

type GetFoundingMakersGeneric = {
  Querystring: z.infer<typeof foundingMakersQuerySchema>;
};

export type GetFoundingMakersRequest = FastifyRequest<GetFoundingMakersGeneric>;
export type GetFoundingMakersReply = FastifyReply<GetFoundingMakersGeneric>;

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

export const makerPreferencesSchema = z.object({
  profileResponse: z.enum(profileQuestionValues),
  objectiveResponse: z.enum(objectiveQuestionValues),
  locationResponse: z.enum(locationQuestionValues),
  diasporaCountry: z.enum(abroadCountryValues).nullable().optional(),
  foundUsByResponse: z.enum(foundUsByQuestionValues),
});

export const getMakerPreferencesRouteSchema = {
  tags: ["makers"],
  response: {
    200: z.object({ data: makerPreferencesSchema }),
    ...routeErrorResponses,
  },
};

export const updateMakerPreferencesRouteSchema = {
  tags: ["makers"],
  body: makerPreferencesSchema,
  response: {
    200: z.object({ data: makerPreferencesSchema }),
    ...routeErrorResponses,
  },
};

export type MakerPreferences = z.infer<typeof makerPreferencesSchema>;
export type GetMakerPreferencesReply = FastifyReply;
export type UpdateMakerPreferencesRequest = FastifyRequest<{
  Body: MakerPreferences;
}>;
export type UpdateMakerPreferencesReply = FastifyReply;
