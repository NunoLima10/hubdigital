import { FastifyInstance } from "fastify";
import { usersController } from "./users-controllers";
import { onboardingRouteSchema } from "./users-schemas";

export async function usersRoutes(server: FastifyInstance) {
  server.post("/onboarding", {
    schema: onboardingRouteSchema,
    handler: usersController.onboardingHandler,
  });
}
