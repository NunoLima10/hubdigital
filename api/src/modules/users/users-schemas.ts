import { errorResponseSchema } from "@/plugins/error-handler";
import { routeErrorResponses } from "@/shared/schemas";
import {
  foundUsByQuestionValues,
  locationQuestionValues,
  objectiveResponsesSchema,
  profileResponsesSchema,
} from "@hubdigital/shared";
import { z } from "zod";
import { abroadCountryValues, badgeKeySchema, islandValues } from "@hubdigital/shared";

export const onboardingRouteSchema = {
  tags: ["users"],
  body: z
    .object({
      bio: z.string().optional().default(""),
      profileResponses: profileResponsesSchema,
      objectiveResponses: objectiveResponsesSchema,
      locationResponse: z.enum(locationQuestionValues),
      diasporaCountry: z.enum(abroadCountryValues).optional(),
      originIsland: z.enum(islandValues).optional(),
      foundUsByResponse: z.enum(foundUsByQuestionValues),
    })
    .refine(
      (body) => body.locationResponse !== "diaspora" || body.originIsland,
      { message: "Escolhe a tua ilha de origem.", path: ["originIsland"] },
    ),
  response: {
    201: z.object({
      data: z.object({
        id: z.number(),
        membershipNumber: z.number(),
        /** Badges earned by joining, for the welcome screen to reveal. */
        badges: z.array(badgeKeySchema),
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

const eligibilityConfirmationResponseSchema = z.object({
  data: z.object({
    confirmedAt: z.string().nullable(),
  }),
});

export const getEligibilityConfirmationRouteSchema = {
  tags: ["users"],
  response: {
    200: eligibilityConfirmationResponseSchema,
    ...routeErrorResponses,
  },
};

export const confirmEligibilityRouteSchema = {
  tags: ["users"],
  body: z.object({
    confirmed: z.literal(true),
  }),
  response: {
    200: eligibilityConfirmationResponseSchema,
    ...routeErrorResponses,
  },
};
