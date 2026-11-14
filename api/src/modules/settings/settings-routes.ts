import { routeErrorResponses } from "@/shared/schemas";
import { publicSettingsSchema } from "@hubdigital/shared";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { SettingsService } from "./settings-services";

const publicSettingsRouteSchema = {
  tags: ["settings"],
  response: {
    200: z.object({ data: publicSettingsSchema }),
    ...routeErrorResponses,
  },
};

/**
 * The two flags the public site needs: whether to show the announcement banner,
 * and whether submissions are open. Unauthenticated on purpose — a logged-out
 * visitor sees the banner too — and deliberately not the whole settings object.
 */
export async function settingsRoutes(server: FastifyInstance) {
  server.get("/public", {
    schema: publicSettingsRouteSchema,
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const settings = await SettingsService.getSettings(req.db);

      return reply.status(200).send({
        data: {
          "submissions.open": settings["submissions.open"],
          "announcement.text": settings["announcement.text"],
        },
      });
    },
  });
}
