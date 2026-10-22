import { z } from "zod";
import { countryValues, islandValues, projectMapRecordSchema } from "@hubdigital/shared";
import { ProjectsService } from "./projects-services";
import { authenticate } from "@/hooks/autenticate";
import { requirePublisher } from "@/hooks/require-publisher";
import { FastifyInstance } from "fastify";
import { projectsController } from "./projects-controllers";
import {
  createProjectRouteSchema,
  deleteProjectRouteSchema,
  getProjectRouteSchema,
  leaderboardRouteSchema,
  listFavoriteProjectsRouteSchema,
  listMyProjectsRouteSchema,
  listProjectsRouteSchema,
  publishProjectRouteSchema,
  toggleUpvoteRouteSchema,
  toggleFavoriteRouteSchema,
  updateProjectRouteSchema,
} from "./projects-schemas";

export async function projectsRoutes(server: FastifyInstance) {
  server.post("/", {
    schema: createProjectRouteSchema,
    preHandler: requirePublisher,
    handler: projectsController.createProjectHandler,
  });

  server.get("/", {
    schema: listProjectsRouteSchema,
    handler: projectsController.listProjectsHandler,
  });

  server.patch("/:id", {
    schema: updateProjectRouteSchema,
    preHandler: requirePublisher,
    handler: projectsController.updateProjectHandler,
  });

  server.delete("/:id", {
    schema: deleteProjectRouteSchema,
    preHandler: requirePublisher,
    handler: projectsController.deleteProjectHandler,
  });

  server.post("/:id/publish", {
    schema: publishProjectRouteSchema,
    preHandler: requirePublisher,
    handler: projectsController.publishProjectHandler,
  });

  // Registered before "/:slug" so the literal path is not captured as a slug.
  server.get("/leaderboard", {
    schema: leaderboardRouteSchema,
    handler: projectsController.leaderboardHandler,
  });

  server.get("/mine", {
    schema: listMyProjectsRouteSchema,
    preHandler: requirePublisher,
    handler: projectsController.listMyProjectsHandler,
  });

  server.get("/favorites", {
    schema: listFavoriteProjectsRouteSchema,
    preHandler: authenticate,
    handler: projectsController.listFavoriteProjectsHandler,
  });

  server.get("/map", {
    schema: {
      tags: ["projects"],
      querystring: z.object({
        limit: z.coerce.number().int().min(1).max(200).default(200),
        offset: z.coerce.number().int().min(0).default(0),
        country: z.enum(countryValues).optional(),
        island: z.enum(islandValues).optional(),
        categoryId: z.coerce.number().int().positive().optional(),
      }),
      response: {
        200: z.object({
          data: z.array(projectMapRecordSchema),
          meta: z.object({ total: z.number(), limit: z.number(), offset: z.number() }),
        }),
      },
    },
    handler: async (request) =>
      ProjectsService.listMapProjects(
        request.db,
        request.query as { limit: number; offset: number },
      ),
  });

  server.get("/:slug", {
    schema: getProjectRouteSchema,
    handler: projectsController.getProjectHandler,
  });

  server.post("/:id/upvote", {
    schema: toggleUpvoteRouteSchema,
    // Tighter than the global limit and keyed by account rather than IP: a
    // shared connection shouldn't throttle everyone, but one account cannot
    // hammer the toggle either.
    config: {
      rateLimit: {
        max: 30,
        timeWindow: "1 minute",
      },
    },
    preHandler: authenticate,
    handler: projectsController.toggleUpvoteHandler,
  });

  server.post("/:id/favorite", {
    schema: toggleFavoriteRouteSchema,
    preHandler: authenticate,
    handler: projectsController.toggleFavoriteHandler,
  });
}
