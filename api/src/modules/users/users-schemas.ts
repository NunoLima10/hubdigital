import { errorResponseSchema } from "@/plugins/error-handler";
import { routeErrorResponses } from "@/shared/schemas";
import {
  foundUsByQuestionValues,
  locationQuestionValues,
  objectiveQuestionValues,
  profileQuestionValues,
} from "@hubdigital/shared";
import { z } from "zod";
import { abroadCountryValues } from "@hubdigital/shared";

export const onboardingRouteSchema = {
  tags: ["users"],
  body: z.object({
    bio: z.string().optional().default(""),
    profileResponse: z.enum(profileQuestionValues),
    objectiveResponse: z.enum(objectiveQuestionValues),
    locationResponse: z.enum(locationQuestionValues),
    diasporaCountry: z.enum(abroadCountryValues).optional(),
    foundUsByResponse: z.enum(foundUsByQuestionValues),
  }),
  response: {
    201: z.object({
      data: z.object({
        id: z.number(),
      }),
    }),
    ...routeErrorResponses
  },
};

export const updateAvatarRouteSchema = {
  tags: ["users"],
  body: z.object({
    // The key of a finished `user_avatar` upload, or null to remove the photo.
    key: z
      .string()
      .regex(/^user_avatar\/[^/\\]+$/, "Imagem inválida. Carrega o ficheiro novamente.")
      .nullable(),
  }),
  response: {
    200: z.object({ data: z.object({ image: z.string().nullable() }) }),
    ...routeErrorResponses,
  },
};
