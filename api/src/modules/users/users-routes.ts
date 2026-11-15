import { authenticate } from "@/hooks/autenticate";
import { FastifyInstance } from "fastify";
import { usersController } from "./users-controllers";
import {
  confirmEligibilityRouteSchema,
  getEligibilityConfirmationRouteSchema,
  onboardingRouteSchema,
  updateAvatarRouteSchema,
} from "./users-schemas";

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

  server.get("/me/eligibility-confirmation", {
    schema: getEligibilityConfirmationRouteSchema,
    preHandler: authenticate,
    handler: usersController.getEligibilityConfirmationHandler,
  });

  server.put("/me/eligibility-confirmation", {
    schema: confirmEligibilityRouteSchema,
    preHandler: authenticate,
    handler: usersController.confirmEligibilityHandler,
  });
}
