import { authenticate } from "@/hooks/autenticate";
import { routeErrorResponses } from "@/shared/schemas";
import { UnauthorizedAccessError } from "@/utils/custom-errors";
import {
  markProjectBadgesSeenBodySchema,
  unseenProjectBadgeSchema,
} from "@hubdigital/shared";
import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { ProjectBadgesService } from "./project-badges-services";

const unseenResponse = {
  200: z.object({ data: z.array(unseenProjectBadgeSchema) }),
  ...routeErrorResponses,
};

function userIdOf(req: FastifyRequest) {
  if (!req.user) throw new UnauthorizedAccessError();
  return req.user.id;
}

/**
 * Achievements on the signed-in maker's projects that they haven't been
 * celebrated for yet, under `/v1/project-badges`.
 */
export async function projectBadgesRoutes(server: FastifyInstance) {
  server.addHook("preHandler", authenticate);

  server.get("/me/unseen", {
    schema: { tags: ["project-badges"], response: unseenResponse },
    handler: async (req) => ({
      data: await ProjectBadgesService.listUnseenForUser(req.db, userIdOf(req)),
    }),
  });

  server.post("/me/seen", {
    schema: {
      tags: ["project-badges"],
      body: markProjectBadgesSeenBodySchema,
      response: unseenResponse,
    },
    handler: async (req) => {
      const userId = userIdOf(req);
      const { ids } = req.body as z.infer<typeof markProjectBadgesSeenBodySchema>;

      await ProjectBadgesService.markSeenForUser(req.db, userId, ids);

      return { data: await ProjectBadgesService.listUnseenForUser(req.db, userId) };
    },
  });
}
