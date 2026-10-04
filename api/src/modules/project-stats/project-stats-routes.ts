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
