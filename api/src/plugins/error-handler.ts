import {
  PG_ERR_FOREIGN_KEY_VIOLATION,
  PG_ERR_UNIQUE_VIOLATION,
} from "@/utils/constants";
import { NotificationsService } from "@/modules/notifications/notifications-services";
import { logger } from "@/utils/logger";
import { FastifyError, FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { hasZodFastifySchemaValidationErrors } from "fastify-type-provider-zod";
import { getPostgresError } from "@/utils/postgres-error";
import { z } from "zod";
import { ProjectPublicationError } from "@/utils/project-publication";


export const errorResponseSchema = z.object({
  error: z.object({
    status: z.string(),
    message: z.string(),
    code: z.string().optional(),
  }),
});


const customErrorHandler: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error: FastifyError, req, reply) => {
    if (error instanceof ProjectPublicationError) {
      return reply.code(400).send({
        error: { message: error.message, code: error.code, issues: error.issues },
      });
    }
    if (hasZodFastifySchemaValidationErrors(error)) {
      logger.warn({ error }, `Zod validation error: ${error.message}`);
      return reply.code(400).send({
        error: {
          message: error.message,
          code: error.code,
        },
      });
    }

    const databaseError = getPostgresError(error);
    if (databaseError?.code === PG_ERR_UNIQUE_VIOLATION) {
      logger.warn({ error }, "Database unique constraint violation");
      return reply.code(409).send({
        error: {
          message: "O recurso já existe.",
          code: databaseError.code,
        },
      });
    }

    if (databaseError?.code === PG_ERR_FOREIGN_KEY_VIOLATION) {
      logger.warn({ error }, "Database foreign key constraint violation");
      return reply.code(400).send({
        error: {
          message: "Um dos recursos referenciados não existe.",
          code: databaseError.code,
        },
      });
    }

    if (error.statusCode) {
      logger.error({ error }, `Handled error: ${error.message}`);
      if (error.statusCode >= 500) {
        NotificationsService.serverError({
          method: req.method,
          route: req.routeOptions?.url ?? "rota desconhecida",
          status: error.statusCode,
          requestId: String(req.id),
          error,
        });
      }
      return reply.code(error.statusCode).send({
        error: {
          message: error.message,
          code: error.code?.toString(),
        },
      });
    }

    logger.error({ error }, "Unhandled internal server error");
    NotificationsService.serverError({
      method: req.method,
      route: req.routeOptions?.url ?? "rota desconhecida",
      status: 500,
      requestId: String(req.id),
      error,
    });
    return reply.code(500).send({
      error: {
        message: "Algo deu errado no servidor",
        code: "FST_INTERNAL_SERVER_ERROR",
      },
    });
  });
};

export default fastifyPlugin(customErrorHandler);
