import { errorResponseSchema } from "@/plugins/error-handler";
import {
  foundUsByQuestionValues,
  locationQuestionValues,
  objectiveQuestionValues,
  profileQuestionValues,
} from "@/utils/constants";
import { z } from "zod";

const onboardingResponseSchema = z.object({
  data: z.object({
    id: z.number(),
  }),
});

export const onboardingRouteSchema = {
  tags: ["users"],
  body: z.object({
    bio: z.string(),
    profileResponse: z.enum(profileQuestionValues),
    objectiveResponse: z.enum(objectiveQuestionValues),
    locationResponse: z.enum(locationQuestionValues),
    foundUsByResponse: z.enum(foundUsByQuestionValues),
  }),
  response: {
    201: onboardingResponseSchema,
    400: errorResponseSchema,
    401: errorResponseSchema,
    500: errorResponseSchema,
  },
};

export type OnboardingResponse = z.infer<typeof onboardingResponseSchema>;
export type OnboardingBody = z.infer<typeof onboardingRouteSchema.body>;
