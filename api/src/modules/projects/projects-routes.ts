import { authenticate } from "@/hooks/autenticate";
import { requirePublisher } from "@/hooks/require-publisher";
import { FastifyInstance } from "fastify";
import { projectsController } from "./projects-controllers";
import {
  createProjectRouteSchema,
  getProjectRouteSchema,
  listMyProjectsRouteSchema,
  listProjectsRouteSchema,
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
    preHandler: authenticate,
    handler: projectsController.toggleUpvoteHandler,
  });
}
