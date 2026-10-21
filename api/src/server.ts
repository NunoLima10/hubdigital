import { communityRoutes } from "./modules/community/community-routes";
import { DB } from "@/db";
import cookiesPlugin from "@/plugins/cookies";
import corsPlugin from "@/plugins/cors";
import errorHandlerPlugin from "@/plugins/error-handler";
import helmetPlugin from "@/plugins/helmet";
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
import { projectsRoutes } from "./modules/projects/projects-routes";
import { projectStatsRoutes } from "./modules/project-stats/project-stats-routes";
import { categoriesRoutes } from "./modules/categories/categories-routes";
import { commentsRoutes } from "./modules/comments/comments-routes";
import { adminRoutes } from "./modules/admin/admin-routes";
import { makersRoutes } from "./modules/makers/makers-routes";
import { reportsRoutes } from "./modules/reports/reports-routes";
import { settingsRoutes } from "./modules/settings/settings-routes";
import { shareImagesRoutes } from "./modules/share-images/share-images-routes";
import { config } from "./config";
import { sql } from "drizzle-orm";
import betterAuth from "./plugins/better-auth";
import uploaderPlugin from "./plugins/uploader";

declare module "fastify" {
  interface FastifyRequest {
    db: DB;
  }
}

const HEALTHCHECK_DB_TIMEOUT_MS = 2_000;

export async function buildServer(db: DB) {
  const server: FastifyInstance = Fastify({
    logger: loggerOptions,
  }).withTypeProvider<ZodTypeProvider>();

  server.addHook("onRequest", async (req: FastifyRequest) => {
    req.db = db;
  });

  await server.register(corsPlugin, {
    // PATCH is used by project updates, maker profiles and the admin settings
    // page; leaving it out made every one of those fail the CORS preflight.
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    origin: config.ALLOWED_ORIGINS,
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  // Swagger UI only exists outside production (below), so production gets the
  // strict JSON-only CSP.
  await server.register(helmetPlugin, {
    strictContentSecurityPolicy: config.isProd,
  });

  await server.register(cookiesPlugin, {
    secret: config.COOKIE_SECRET,
  });

  await server.register(rateLimitPlugin, {
    max: 100,
    timeWindow: "1 minute",
  });

  await server.register(betterAuth);

  await server.register(errorHandlerPlugin);

  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  // The docs list every route, admin ones included — useful locally, a free
  // map of the attack surface in production.
  if (!config.isProd) {
    await server.register(swaggerPlugin, {
      title: "Hub Digital API",
      description: "Backend API para Hub Digital",
      version: "0.1.0",
      host: config.HOST,
      port: config.PORT,
      path: "/docs",
    });
  }

  await server.register(uploaderPlugin);

  await server.register(usersRoutes, { prefix: "/v1/users" });
  await server.register(projectsRoutes, { prefix: "/v1/projects" });
  await server.register(projectStatsRoutes, { prefix: "/v1/projects" });
  await server.register(categoriesRoutes, { prefix: "/v1/categories" });
  // Registered at /v1 because it owns both /projects/:slug/comments and
  // /comments/:id.
  await server.register(communityRoutes, {prefix:"/v1"});
  await server.register(commentsRoutes, { prefix: "/v1" });
  await server.register(makersRoutes, { prefix: "/v1/makers" });
  await server.register(reportsRoutes, { prefix: "/v1/reports" });
  await server.register(settingsRoutes, { prefix: "/v1/settings" });
  await server.register(shareImagesRoutes, { prefix: "/v1/share-images" });
  // Registered last, and behind its own role guard — see modules/admin/admin-routes.
  await server.register(adminRoutes, { prefix: "/v1/admin" });

  if (!config.isProd) {
    server.get("/", async (req: FastifyRequest, reply: FastifyReply) => {
      reply.redirect("/docs");
    });
  }

  // Probed every few seconds by the host, so it skips the per-IP rate limit.
  // A process that is up but cannot reach Postgres is not healthy.
  server.get(
    "/healthcheck",
    { config: { rateLimit: false } },
    async (req, reply) => {
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          db.execute(sql`SELECT 1`),
          new Promise((_, reject) => {
            timeout = setTimeout(
              () => reject(new Error("Database check timed out")),
              HEALTHCHECK_DB_TIMEOUT_MS
            );
          }),
        ]);
        return reply.send({ status: "ok", database: "ok" });
      } catch (error) {
        req.log.error(error, "Healthcheck database probe failed");
        return reply
          .status(503)
          .send({ status: "error", database: "unreachable" });
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    }
  );

  return server;
}
