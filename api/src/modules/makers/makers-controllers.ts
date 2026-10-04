import { ConflictError, NotFoundError } from "@/utils/custom-errors";
import { FastifyReply, FastifyRequest } from "fastify";
import {
  GetMakerReply,
  GetMakerRequest,
  GetMakerPreferencesReply,
  UpdateMakerPreferencesReply,
  UpdateMakerPreferencesRequest,
  UpdateMakerReply,
  UpdateMakerRequest,
} from "./makers-schemas";
import { MakersService } from "./makers-services";

async function getMakerHandler(req: GetMakerRequest, reply: GetMakerReply) {
  const profile = await MakersService.getProfileByHandle(
    req.db,
    req.params.handle.toLowerCase(),
    req.user?.id
  );

  if (!profile) {
    throw new NotFoundError();
  }

  return reply.status(200).send({ data: profile });
}

async function getMyHandleHandler(req: FastifyRequest, reply: FastifyReply) {
  const handle = await MakersService.getProfileByUserId(req.db, req.user!.id);

  return reply.status(200).send({ data: { handle } });
}

async function updateMakerHandler(
  req: UpdateMakerRequest,
  reply: UpdateMakerReply
) {
  const result = await MakersService.updateProfile(
    req.db,
    req.user!.id,
    req.body
  );

  if (result === "taken") {
    throw new ConflictError("Esse nome de utilizador já está em uso.");
  }

  if (!result) {
    throw new NotFoundError();
  }

  return reply.status(200).send({ data: result });
}

async function getPreferencesHandler(
  req: FastifyRequest,
  reply: GetMakerPreferencesReply,
) {
  const preferences = await MakersService.getPreferences(req.db, req.user!.id);
  if (!preferences) throw new NotFoundError();
  return reply.status(200).send({ data: preferences });
}

async function updatePreferencesHandler(
  req: UpdateMakerPreferencesRequest,
  reply: UpdateMakerPreferencesReply,
) {
  const preferences = await MakersService.updatePreferences(
    req.db,
    req.user!.id,
    req.body,
  );
  if (!preferences) throw new NotFoundError();
  return reply.status(200).send({ data: preferences });
}

export const makersController = {
  getMakerHandler,
  getMyHandleHandler,
  updateMakerHandler,
  getPreferencesHandler,
  updatePreferencesHandler,
};
