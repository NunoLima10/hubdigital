import { routeErrorResponses } from "@/shared/schemas";
import { siteStatsSchema } from "@hubdigital/shared";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { SiteStatsService } from "./site-stats-services";

/**
 * Public site-wide numbers (visitors, pageviews; this year and all time) for
 * the home sidebar.
 * Unauthenticated: they are shown to everyone. `data` is null when PostHog is
 * not configured, and the site then hides the card.
 */
export async function siteStatsRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.get("/", {
    schema: {
      tags: ["site-stats"],
      response: {
        200: z.object({ data: siteStatsSchema.nullable() }),
        ...routeErrorResponses,
      },
    },
    handler: async (req, reply) => {
      const data = await SiteStatsService.get(req.db);
      // Browsers and the CDN may reuse it briefly; the API caches longer.
      reply.header("Cache-Control", "public, max-age=60");
      return reply.status(200).send({ data });
    },
  });
}
