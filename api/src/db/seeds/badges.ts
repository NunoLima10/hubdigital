import { badgeDefinitions } from "@hubdigital/shared";
import { sql } from "drizzle-orm";
import { DB } from "@/db";
import { logger } from "@/utils/logger";
import { badges } from "../schemas";

/** Mirrors `badgeCatalog` into the `badges` table; safe to run repeatedly. */
export default async function seed(db: DB) {
  try {
    await db
      .insert(badges)
      .values(
        badgeDefinitions.map(({ key, awardMode, sortOrder }) => ({
          key,
          awardMode,
          sortOrder,
        })),
      )
      .onConflictDoUpdate({
        target: badges.key,
        set: {
          awardMode: sql`excluded.award_mode`,
          sortOrder: sql`excluded.sort_order`,
        },
      });

    logger.info("Badges seeded successfully.");
  } catch (error) {
    logger.error(error, "Unexpected error during Badges seeding");
    throw error;
  }
}
