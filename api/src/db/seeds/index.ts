import { config } from "@/config";
import { logger } from "@/utils/logger";
import { DB } from "../index";
import badges from "./badges";
import categories from "./categories";
import admin from "./users/admin";
import demoAdmin from "./users/demo-admin";
import publishers from "./users/publishers";
import airtableProjects from "./airtable-projects";

/**
 * Static data every environment needs, production included: the category
 * catalog, the badge catalog and (only when ADMIN_SEED_* are set) the first
 * admin. Idempotent, so it is safe to run on every deploy. Any failure throws,
 * so a deploy never carries on with an empty category list.
 */
export async function seedReferenceData(db: DB) {
  await categories(db);
  await badges(db);
  await admin(db);
}

/**
 * Demo accounts and sample projects. Development only: never run against a
 * production database.
 */
export async function seedDevelopmentFixtures(db: DB) {
  if (!config.isDev) {
    throw new Error("Development fixtures refused: NODE_ENV is not development.");
  }

  await publishers();
  await demoAdmin(db);
  await airtableProjects(db);
}

export async function RundSeeding(db: DB) {
  logger.info("Seeding Started");

  await seedReferenceData(db);
  if (config.isDev) {
    await seedDevelopmentFixtures(db);
  }
}
