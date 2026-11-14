import { z } from "zod";
import {
  destinationStatsSchema,
  linkClickSurfaceValues,
  statsRangeValues,
  type LinkClickSurface,
} from "@hubdigital/shared";
import { NotFoundError } from "@/utils/custom-errors";
import {
  findPublicDestination,
  recordDestinationClick,
  getDestinationStats,
} from "./project-link-services";
import { requirePublisher } from "@/hooks/require-publisher";
import { FastifyInstance } from "fastify";
import { projectStatsController } from "./project-stats-controllers";
import {
  getMyProjectStatsRouteSchema,
  getProjectStatsRouteSchema,
  recordEventRouteSchema,
} from "./project-stats-schemas";

/**
 * Registered under the same `/v1/projects` prefix as the projects module, so
 * these read as sub-resources of a project.
 */
export async function projectStatsRoutes(server: FastifyInstance) {
  const destinationSchema = {
    params: z.object({ linkId: z.coerce.number().int().positive() }),
    querystring: z
      .object({ surface: z.enum(linkClickSurfaceValues).default("detail") })
      .strict(),
  };
  server.get("/go/:linkId", {
    schema: destinationSchema,
    handler: async (req, reply) => {
      const params = req.params as { linkId: number };
      const query = req.query as { surface: LinkClickSurface };
      const destination = await findPublicDestination(req.db, params.linkId);
      if (!destination) throw new NotFoundError();
      const recording = recordDestinationClick(req.db, destination, {
        surface: query.surface,
        viewerUserId: req.user?.id,
        userAgent: req.headers["user-agent"],
        prefetch: /prefetch|prerender/i.test(
          String(req.headers["purpose"] ?? req.headers["sec-purpose"] ?? ""),
        ),
      }).catch(() => {
        req.log.warn("Destination click could not be counted");
      });
      let timeout: ReturnType<typeof setTimeout> | undefined;
      await Promise.race([
        recording,
        new Promise<void>((resolve) => {
          timeout = setTimeout(resolve, 250);
        }),
      ]);
      if (timeout) clearTimeout(timeout);
      return reply.header("Cache-Control", "no-store").redirect(destination.href);
    },
  });
  server.post("/links/:linkId/click", {
    schema: destinationSchema,
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: async (req, reply) => {
      const destination = await findPublicDestination(
        req.db,
        (req.params as { linkId: number }).linkId,
      );
      if (destination)
        await recordDestinationClick(req.db, destination, {
          surface: (req.query as { surface: LinkClickSurface }).surface,
          viewerUserId: req.user?.id,
          userAgent: req.headers["user-agent"],
          prefetch: false,
        }).catch(() => {});
      return reply.status(204).send();
    },
  });
  server.get("/:id/link-stats", {
    schema: {
      params: z.object({ id: z.coerce.number().int().positive() }),
      querystring: z.object({ range: z.enum(statsRangeValues).default("30d") }),
      response: { 200: z.object({ data: destinationStatsSchema }) },
    },
    preHandler: requirePublisher,
    handler: async (req) => {
      const stats = await getDestinationStats(
        req.db,
        req.publisher.id,
        (req.params as { id: number }).id,
        (req.query as { range: import("@hubdigital/shared").StatsRange }).range,
      );
      if (!stats) throw new NotFoundError();
      return { data: stats };
    },
  });
  server.post("/:id/events", {
    schema: recordEventRouteSchema,
    // Public and unauthenticated, so it gets its own limit rather than sharing
    // the global one. It only bounds abuse: a browser sends a couple of events
    // per page, and one that gets throttled loses a count, nothing more.
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: projectStatsController.recordEventHandler,
  });

  // Registered before "/:id/stats" for readability; the static segment wins
  // over the param either way.
  server.get("/mine/stats", {
    schema: getMyProjectStatsRouteSchema,
    preHandler: requirePublisher,
    handler: projectStatsController.getMyProjectStatsHandler,
  });

  server.get("/:id/stats", {
    schema: getProjectStatsRouteSchema,
    preHandler: requirePublisher,
    handler: projectStatsController.getProjectStatsHandler,
  });
}
