import { authenticate } from "@/hooks/autenticate";
import { requirePublisher } from "@/hooks/require-publisher";
import { FastifyInstance, FastifyRequest } from "fastify";
import { projectsController } from "./projects-controllers";
import {
  createProjectRouteSchema,
  deleteProjectRouteSchema,
  getProjectRouteSchema,
  leaderboardRouteSchema,
  listMyProjectsRouteSchema,
  listProjectsRouteSchema,
  publishProjectRouteSchema,
  toggleUpvoteRouteSchema,
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
        keyGenerator: (req: FastifyRequest) => req.user?.id ?? req.ip,
      },
    },
    preHandler: authenticate,
    handler: projectsController.toggleUpvoteHandler,
  });
}
