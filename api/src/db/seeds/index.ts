import { config } from "@/config";
import { logger } from "@/utils/logger";
import { DB } from "../index";
import categories from "./categories";
import admin from "./users/admin";
import demoAdmin from "./users/demo-admin";
import publishers from "./users/publishers";

export async function RundSeeding(db: DB) {
  logger.info("Seeding Started");

  if (config.isDev) {
    await publishers();
    await demoAdmin(db);
  }

  // Runs in every environment, not just dev: production needs a first admin
  // too, and the seed no-ops unless ADMIN_SEED_* are set.
  await admin(db);

  await categories(db);
}
