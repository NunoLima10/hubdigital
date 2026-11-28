import { BadRequestError, UnauthorizedAccessError } from "@/utils/custom-errors";
import { FastifyReply, FastifyRequest } from "fastify";
import {
  confirmEligibilityRouteSchema,
  onboardingRouteSchema,
  updateAvatarRouteSchema,
} from "./users-schemas";
import { UserService } from "./users-services";
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
    diasporaCountry,
    originIsland,
    objectiveResponses,
    profileResponses,
  } = req.body;

  const data = await UserService.completeOnboarding(req.db, {
    bio,
    foundUsByResponse,
    locationResponse,
    diasporaCountry: locationResponse === "diaspora" ? diasporaCountry : undefined,
    originIsland: locationResponse === "diaspora" ? originIsland : undefined,
    objectiveResponses,
    profileResponses,
    userId: req.user.id,
  });

  return reply.status(201).send({ data });
}

async function updateAvatarHandler(
  req: FastifyRequest<{ Body: z.infer<typeof updateAvatarRouteSchema.body> }>,
  reply: FastifyReply
) {
  if (!req.user) throw new UnauthorizedAccessError();

  const image = await UserService.updateAvatar(req.db, req.user.id, req.body.key);
  if (image === undefined) {
    throw new BadRequestError("Imagem inválida. Carrega o ficheiro novamente.");
  }

  return reply.status(200).send({ data: { image } });
}

async function getEligibilityConfirmationHandler(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  if (!req.user) throw new UnauthorizedAccessError();

  const confirmedAt = await UserService.getEligibilityConfirmation(
    req.db,
    req.user.id,
  );
  return reply.status(200).send({
    data: { confirmedAt: confirmedAt?.toISOString() ?? null },
  });
}

async function confirmEligibilityHandler(
  req: FastifyRequest<{ Body: z.infer<typeof confirmEligibilityRouteSchema.body> }>,
  reply: FastifyReply,
) {
  if (!req.user) throw new UnauthorizedAccessError();

  const confirmedAt = await UserService.confirmEligibility(req.db, req.user.id);
  return reply.status(200).send({
    data: { confirmedAt: confirmedAt.toISOString() },
  });
}

export const usersController = {
  onboardingHandler,
  updateAvatarHandler,
  getEligibilityConfirmationHandler,
  confirmEligibilityHandler,
};
