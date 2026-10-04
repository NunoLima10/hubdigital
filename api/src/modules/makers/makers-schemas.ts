import { errorResponseSchema, routeErrorResponses } from "@/shared/schemas";
import {
  makerProfileSchema,
  makerProfileUpdateSchema,
} from "@hubdigital/shared";
import {
  foundUsByQuestionValues,
  locationQuestionValues,
  objectiveQuestionValues,
  profileQuestionValues,
} from "@/utils/constants";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { abroadCountryValues } from "@hubdigital/shared";

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
