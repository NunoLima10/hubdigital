import { FastifyInstance } from "fastify";
import { buildServer } from "./server";
import { env } from "@/utils/env";
import { logger } from "@/utils/logger";
import { DBClient, setupDB, teardownDB } from "@/db";

async function gracefulShutdown(server: FastifyInstance, dbClient: DBClient) {
  await server.close();
  await teardownDB(dbClient);
  process.exit(0);
}

async function start() {
  const { db, dbClient } = await setupDB(env.DATABASE_URL);
  const server = await buildServer(db);

  try {
    await server.listen({
      port: env.PORT,
      host: env.HOST,
    });
    logger.info(`Server is running on port ${env.PORT}`);
  } catch (error) {
    logger.error(error);
    await gracefulShutdown(server, dbClient);
    process.exit(1);
  }

  process.on("SIGINT", () => gracefulShutdown(server, dbClient));
  process.on("SIGTERM", () => gracefulShutdown(server, dbClient));
  process.on("uncaughtException", (error) => {
    logger.error(error);
  });
}

start();
