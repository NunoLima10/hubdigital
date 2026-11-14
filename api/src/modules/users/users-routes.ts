import { authenticate } from "@/hooks/autenticate";
import { FastifyInstance } from "fastify";
import { usersController } from "./users-controllers";
import { onboardingRouteSchema, updateAvatarRouteSchema } from "./users-schemas";

export async function usersRoutes(server: FastifyInstance) {
  server.post("/onboarding", {
    schema: onboardingRouteSchema,
    handler: usersController.onboardingHandler,
  });

  server.put("/me/avatar", {
    schema: updateAvatarRouteSchema,
    preHandler: authenticate,
    handler: usersController.updateAvatarHandler,
  });
}
