import { authenticate } from "@/hooks/autenticate";
import { routeErrorResponses } from "@/shared/schemas";
import { NotFoundError, UnauthorizedAccessError } from "@/utils/custom-errors";
import {
  featureBadgeBodySchema,
  markBadgesSeenBodySchema,
  myBadgeSchema,
} from "@hubdigital/shared";
import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { BadgesService } from "./badges-services";

const myBadgesResponse = {
  200: z.object({ data: z.array(myBadgeSchema) }),
  ...routeErrorResponses,
};

function userIdOf(req: FastifyRequest) {
  if (!req.user) throw new UnauthorizedAccessError();
  return req.user.id;
}

/** The signed-in user's own badges, under `/v1/badges`. */
export async function badgesRoutes(server: FastifyInstance) {
  server.addHook("preHandler", authenticate);

  server.get("/me", {
    schema: { tags: ["badges"], response: myBadgesResponse },
    handler: async (req) => ({
      data: await BadgesService.listForUser(req.db, userIdOf(req)),
    }),
  });

  server.put("/me/featured", {
    schema: {
      tags: ["badges"],
      body: featureBadgeBodySchema,
      response: myBadgesResponse,
    },
    handler: async (req) => {
      const userId = userIdOf(req);
      const { key } = req.body as z.infer<typeof featureBadgeBodySchema>;

      const updated = await BadgesService.setFeatured(req.db, userId, key);
      if (!updated) throw new NotFoundError();

      return { data: await BadgesService.listForUser(req.db, userId) };
    },
  });

  server.post("/me/seen", {
    schema: {
      tags: ["badges"],
      body: markBadgesSeenBodySchema,
      response: myBadgesResponse,
    },
    handler: async (req) => {
      const userId = userIdOf(req);
      const { keys } = req.body as z.infer<typeof markBadgesSeenBodySchema>;

      await BadgesService.markSeen(req.db, userId, keys);

      return { data: await BadgesService.listForUser(req.db, userId) };
    },
  });
}
