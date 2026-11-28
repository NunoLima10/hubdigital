import { getLaunchGate } from "@/lib/launch-gate";
import { routeErrorResponses } from "@/shared/schemas";
import { isStaffRole, launchStatusSchema } from "@hubdigital/shared";
import { FastifyInstance } from "fastify";
import { z } from "zod";

/**
 * Whether the site is still closed before launch, and the countdown date.
 * Public and reachable while locked (plugins/launch-gate.ts): the web renders
 * the countdown page from it. `bypass` tells staff they see the real site.
 */
export async function launchGateRoutes(server: FastifyInstance) {
  server.get("/", {
    schema: {
      tags: ["launch"],
      response: {
        200: z.object({ data: launchStatusSchema }),
        ...routeErrorResponses,
      },
    },
    handler: async (req, reply) => {
      const gate = await getLaunchGate();
      return reply
        .header("Cache-Control", "no-store")
        .send({
          data: {
            locked: gate.locked,
            launchAt: gate.launchAt,
            bypass: gate.locked && Boolean(req.user && isStaffRole(req.user.role)),
            now: new Date().toISOString(),
          },
        });
    },
  });
}
