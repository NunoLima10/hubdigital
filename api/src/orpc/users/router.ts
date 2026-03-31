import { auth } from "@/lib/auth";
import { UserService } from "@/modules/users/users-services";
import {
  foundUsByQuestionValues,
  locationQuestionValues,
  objectiveQuestionValues,
  profileQuestionValues,
} from "@/utils/constants";
import { fromNodeHeaders } from "better-auth/node";
import { z } from "zod";
import { authed } from "../base";

const onboardingInput = z.object({
  bio: z.string().optional().default(""),
  profileResponse: z.enum(profileQuestionValues),
  objectiveResponse: z.enum(objectiveQuestionValues),
  locationResponse: z.enum(locationQuestionValues),
  foundUsByResponse: z.enum(foundUsByQuestionValues),
});

export const usersRouter = {
  onboarding: authed.input(onboardingInput).handler(async ({ input, context }) => {
    const publisher = await UserService.createPublisher(context.db, {
      ...input,
      userId: context.user!.id,
    });

    await auth.api.updateUser({
      headers: fromNodeHeaders(context.req.headers),
      body: { onboardedAt: new Date() },
    });

    return { id: publisher.id };
  }),
};
