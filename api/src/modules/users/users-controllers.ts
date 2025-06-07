import { InvalidOAuth, InvalidTokenError } from "@/utils/custom-errors";
import { clerkClient, getAuth } from "@clerk/fastify";
import { FastifyReply, FastifyRequest } from "fastify";
import { OnboardingBody, OnboardingResponse } from "./users-schemas";
import { usersService } from "./users-services";

async function onboardingHandler(
  req: FastifyRequest<{ Body: OnboardingBody }>,
  reply: FastifyReply
) {
  const { userId } = getAuth(req);

  if (!userId) throw new InvalidTokenError();

  const user = await clerkClient.users.getUser(userId);

  const profile = await usersService.createProfile(req.db, req.body);

  const email = user.emailAddresses.pop()?.emailAddress;
  const fullName = user.fullName;

  if (!email || !fullName) throw new InvalidOAuth();

  const account = await usersService.createAccount(req.db, {
    clerk_user_id: userId,
    profileId: profile.id,
    email: email,
    fullName: fullName,
    avatarUrl: user.imageUrl,
  });

  const response: OnboardingResponse = {
    data: {
      id: account.id,
    },
  };

  return reply.status(201).send(response);
}

export const usersController = {
  onboardingHandler,
};
