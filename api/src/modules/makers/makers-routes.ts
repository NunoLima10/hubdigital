import { authenticate } from "@/hooks/autenticate";
import { requirePublisher } from "@/hooks/require-publisher";
import { FastifyInstance } from "fastify";
import { makersController } from "./makers-controllers";
import {
  getMakerRouteSchema,
  getMakerPreferencesRouteSchema,
  getMyHandleRouteSchema,
  updateMakerRouteSchema,
  updateMakerPreferencesRouteSchema,
} from "./makers-schemas";

export async function makersRoutes(server: FastifyInstance) {
  // Registered before "/:handle" so the literal path is not read as a handle.
  server.get("/me", {
    schema: getMyHandleRouteSchema,
    preHandler: authenticate,
    handler: makersController.getMyHandleHandler,
  });

  server.patch("/me", {
    schema: updateMakerRouteSchema,
    preHandler: requirePublisher,
    handler: makersController.updateMakerHandler,
  });

  server.get("/me/preferences", {
    schema: getMakerPreferencesRouteSchema,
    preHandler: requirePublisher,
    handler: makersController.getPreferencesHandler,
  });

  server.patch("/me/preferences", {
    schema: updateMakerPreferencesRouteSchema,
    preHandler: requirePublisher,
    handler: makersController.updatePreferencesHandler,
  });

  server.get("/:handle", {
    schema: getMakerRouteSchema,
    handler: makersController.getMakerHandler,
  });
}
