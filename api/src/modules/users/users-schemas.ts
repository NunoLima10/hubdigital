import { errorResponseSchema } from "@/plugins/error-handler";
import { routeErrorResponses } from "@/shared/schemas";
import {
  foundUsByQuestionValues,
  locationQuestionValues,
  objectiveQuestionValues,
  profileQuestionValues,
} from "@/utils/constants";
import { z } from "zod";

export const onboardingRouteSchema = {
  tags: ["users"],
  body: z.object({
    bio: z.string().optional().default(""),
    profileResponse: z.enum(profileQuestionValues),
    objectiveResponse: z.enum(objectiveQuestionValues),
    locationResponse: z.enum(locationQuestionValues),
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
