import { DB } from "@/db";
import cookiesPlugin from "@/plugins/cookies";
import corsPlugin from "@/plugins/cors";
import errorHandlerPlugin from "@/plugins/error-handler";
import rateLimitPlugin from "@/plugins/rate-limiter";
import swaggerPlugin from "@/plugins/swagger";
import { loggerOptions } from "@/utils/logger";
import Fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { usersRoutes } from "./modules/users/users-routes";
import { config } from "./config";

declare module "fastify" {
  interface FastifyRequest {
    db: DB;
  }
}

export async function buildServer(db: DB) {
  const server: FastifyInstance = Fastify({
    logger: loggerOptions,
  }).withTypeProvider<ZodTypeProvider>();

  server.addHook("onRequest", async (req: FastifyRequest) => {
    req.db = db;
  });

  await server.register(corsPlugin, {
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    origin: config.ALLOWED_ORIGINS,
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  await server.register(cookiesPlugin, {
    secret: config.COOKIE_SECRET,
  });

  await server.register(rateLimitPlugin, {
    max: 100,
    timeWindow: "1 minute",
  });

  await server.register(errorHandlerPlugin);

  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  await server.register(swaggerPlugin, {
    title: "Hub Digital API",
    description: "Backend API para Hub Digital",
    version: "0.1.0",
    host: config.HOST,
    port: config.PORT,
    path: "/docs",
  });

  await server.register(usersRoutes, { prefix: "/v1/users" });

  server.get("/", async (req: FastifyRequest, reply: FastifyReply) => {
    reply.redirect("/docs");
  });

  server.get("/healthcheck", async (_, reply) => {
    reply.send({ status: "ok" });
  });

  return server;
}
