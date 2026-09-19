import { authenticate } from "@/hooks/autenticate";
import { errorResponseSchema, routeErrorResponses } from "@/shared/schemas";
import { NotFoundError } from "@/utils/custom-errors";
import { createReportBodySchema } from "@hubdigital/shared";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { ReportsService } from "./reports-services";

const createReportRouteSchema = {
  tags: ["reports"],
  body: createReportBodySchema,
  response: {
    201: z.object({
      data: z.object({ id: z.number().nullable(), duplicate: z.boolean() }),
    }),
    403: errorResponseSchema,
    ...routeErrorResponses,
  },
};

type CreateReportGeneric = { Body: z.infer<typeof createReportBodySchema> };

export async function reportsRoutes(server: FastifyInstance) {
  server.post("/", {
    schema: createReportRouteSchema,
    // Reporting is cheap to abuse and the inbox is ordered by report count, so
    // the budget here is deliberately tight and keyed by account.
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "1 hour",
        keyGenerator: (req: FastifyRequest) => req.user?.id ?? req.ip,
      },
    },
    preHandler: authenticate,
    handler: async (
      req: FastifyRequest<CreateReportGeneric>,
      reply: FastifyReply<CreateReportGeneric>
    ) => {
      const { targetType, targetId } = req.body;

      const exists = await ReportsService.targetExists(
        req.db,
        targetType,
        targetId
      );

      if (!exists) throw new NotFoundError();

      const result = await ReportsService.createReport(req.db, {
        reporterId: req.user!.id,
        targetType,
        targetId,
        reason: req.body.reason,
        details: req.body.details,
      });

      // A repeat report answers 201 as well: from the reporter's side they did
      // report it, and telling them otherwise only invites a retry.
      return reply.status(201).send({ data: result });
    },
  });
}
