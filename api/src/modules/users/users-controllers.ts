import { UnauthorizedAccessError } from "@/utils/custom-errors";
import { FastifyReply, FastifyRequest } from "fastify";
import { onboardingRouteSchema } from "./users-schemas";
import { UserService } from "./users-services";
import { auth } from "@/lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { z } from "zod";

async function onboardingHandler(
  req: FastifyRequest<{ Body: z.infer<typeof onboardingRouteSchema.body> }>,
  reply: FastifyReply
) {
  if (!req.user) throw new UnauthorizedAccessError();

  const {
    bio,
    foundUsByResponse,
    locationResponse,
    objectiveResponse,
    profileResponse,
  } = req.body;

  const publisher = await UserService.createPublisher(req.db, {
    bio,
    foundUsByResponse,
    locationResponse,
    objectiveResponse,
    profileResponse,
    userId: req.user.id,
  });

  await auth.api.updateUser({
    headers: fromNodeHeaders(req.headers),
    body: {
      onboardingComplete: true as any,
    },
  });

  return reply.status(201).send({
    data: {
      id: publisher.id,
    },
  });
}

export const usersController = {
  onboardingHandler,
};
