import { config } from "@/config";
import { logger } from "@/utils/logger";
import { DB } from "../index";
import categories from "./categories";
import publishers from "./users/publishers";

export async function RundSeeding(db: DB) {
  logger.info("Seeding Started");

  if (config.isDev) {
    await publishers();
  }
  await categories(db);
}
