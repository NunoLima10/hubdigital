import { BadgesService } from "@/modules/badges/badges-services";
import { MakersService } from "@/modules/makers/makers-services";
import { BadRequestError, UnauthorizedAccessError } from "@/utils/custom-errors";
import { FastifyReply, FastifyRequest } from "fastify";
import {
  confirmEligibilityRouteSchema,
  onboardingRouteSchema,
  updateAvatarRouteSchema,
} from "./users-schemas";
import { UserService } from "./users-services";
import { fromNodeHeaders } from "better-auth/node";
import { z } from "zod";
import { auth } from "@/lib/auth";

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

  // Every publisher gets a profile URL from the moment they onboard, derived
  // from their display name.
  const name = await MakersService.findUserName(req.db, req.user.id);
  const handle = await MakersService.generateUniqueHandle(req.db, name);

  const publisher = await UserService.createPublisher(req.db, {
    bio,
    foundUsByResponse,
    locationResponse,
    diasporaCountry: locationResponse === "diaspora" ? diasporaCountry : undefined,
    originIsland: locationResponse === "diaspora" ? originIsland : undefined,
    objectiveResponses,
    profileResponses,
    handle,
    userId: req.user.id,
  });

  // Early members earn their founding badge the moment they join; the client
  // reveals it on the welcome screen.
  const foundingBadge = await BadgesService.awardFoundingBadge(
    req.db,
    req.user.id,
    publisher.membershipNumber,
  );

  await auth.api.updateUser({
    headers: fromNodeHeaders(req.headers),
    body: {
      onboardedAt: new Date(),
    },
  });

  return reply.status(201).send({
    data: {
      id: publisher.id,
      membershipNumber: publisher.membershipNumber,
      badges: foundingBadge ? [foundingBadge] : [],
    },
  });
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
