import {
  PG_ERR_FOREIGN_KEY_VIOLATION,
  PG_ERR_UNIQUE_VIOLATION,
} from "@/utils/constants";
import { logger } from "@/utils/logger";
import { FastifyError, FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { hasZodFastifySchemaValidationErrors } from "fastify-type-provider-zod";
import { PostgresError } from "postgres";
import { z } from "zod";


export const errorResponseSchema = z.object({
  error: z.object({
    status: z.string(),
    message: z.string(),
    code: z.string().optional(),
  }),
});


const customErrorHandler: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error: FastifyError, req, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      logger.warn({ error }, `Zod validation error: ${error.message}`);
      return reply.code(400).send({
        error: {
          message: error.message,
          code: error.code,
        },
      });
    }

    if (
      error instanceof PostgresError &&
      error.code === PG_ERR_UNIQUE_VIOLATION
    ) {
      logger.warn({ error }, "Database unique constraint violation");
      return reply.code(409).send({
        error: {
          message: "O recurso já existe.",
          code: error.code,
        },
      });
    }

    if (
      error instanceof PostgresError &&
      error.code === PG_ERR_FOREIGN_KEY_VIOLATION
    ) {
      logger.warn({ error }, "Database foreign key constraint violation");
      return reply.code(400).send({
        error: {
          message: "Um dos recursos referenciados não existe.",
          code: error.code,
        },
      });
    }

    if (error.statusCode) {
      logger.error({ error }, `Handled error: ${error.message}`);
      return reply.code(error.statusCode).send({
        error: {
          message: error.message,
          code: error.code?.toString(),
        },
      });
    }

    logger.error({ error }, "Unhandled internal server error");
    return reply.code(500).send({
      error: {
        message: "Algo deu errado no servidor",
        code: "FST_INTERNAL_SERVER_ERROR",
      },
    });
  });
};

export default fastifyPlugin(customErrorHandler);
