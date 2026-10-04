import { errorResponseSchema } from "@/plugins/error-handler";
import { routeErrorResponses } from "@/shared/schemas";
import {
  foundUsByQuestionValues,
  locationQuestionValues,
  objectiveQuestionValues,
  profileQuestionValues,
} from "@/utils/constants";
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
