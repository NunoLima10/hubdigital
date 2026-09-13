import { authenticate } from "@/hooks/autenticate";
import { FastifyInstance, FastifyRequest } from "fastify";
import { commentsController } from "./comments-controllers";
import {
  createCommentRouteSchema,
  deleteCommentRouteSchema,
  listCommentsRouteSchema,
  updateCommentRouteSchema,
} from "./comments-schemas";

export async function commentsRoutes(server: FastifyInstance) {
  server.get("/projects/:slug/comments", {
    schema: listCommentsRouteSchema,
    handler: commentsController.listCommentsHandler,
  });

  server.post("/projects/:slug/comments", {
    schema: createCommentRouteSchema,
    // Posting is cheap to abuse, so it gets a tighter budget than the global
    // limit, keyed by account.
    config: {
      rateLimit: {
        max: 20,
        timeWindow: "1 minute",
        keyGenerator: (req: FastifyRequest) => req.user?.id ?? req.ip,
      },
    },
    preHandler: authenticate,
    handler: commentsController.createCommentHandler,
  });

  server.patch("/comments/:id", {
    schema: updateCommentRouteSchema,
    preHandler: authenticate,
    handler: commentsController.updateCommentHandler,
  });

  server.delete("/comments/:id", {
    schema: deleteCommentRouteSchema,
    preHandler: authenticate,
    handler: commentsController.deleteCommentHandler,
  });
}
