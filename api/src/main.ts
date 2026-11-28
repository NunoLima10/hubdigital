import { FastifyInstance } from "fastify";
import { buildServer } from "./server";
import { logger } from "@/utils/logger";
import { DBClient, setupDB, teardownDB } from "@/db";
import { config } from "./config";
import { analytics } from "@/lib/analytics";
import { startProjectBadgeJobs } from "@/modules/project-badges/project-badges-services";

let stopProjectBadgeJobs: (() => void) | undefined;

async function gracefulShutdown(server: FastifyInstance, dbClient: DBClient, exitCode = 0) {
  stopProjectBadgeJobs?.();
  await server.close();
  await analytics.shutdown();
  await teardownDB(dbClient);
  process.exit(exitCode);
}

async function start() {
  const { db, dbClient } = await setupDB(config.DATABASE_URL);
  const server = await buildServer(db);

  try {
    await server.listen({
      port: config.PORT,
      host: config.HOST,
    });
    logger.info(`Server is running on port ${config.PORT}`);
    // Weekly ranking close, upvote milestones and pioneer plaques.
    stopProjectBadgeJobs = startProjectBadgeJobs(db);
  } catch (error) {
    logger.error(error);
    await gracefulShutdown(server, dbClient, 1);
    return;
  }

  process.on("SIGINT", () => gracefulShutdown(server, dbClient));
  process.on("SIGTERM", () => gracefulShutdown(server, dbClient));
  process.on("uncaughtException", (error) => {
    logger.error(error);
  });
}

start();
