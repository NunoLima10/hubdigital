import { categoryCatalog } from "@hubdigital/shared";
import { sql } from "drizzle-orm";
import { DB } from "@/db";
import { logger } from "@/utils/logger";
import { categories } from "../schemas";

export default async function seed(db: DB) {
  try {
    const values = categoryCatalog.map(({ key, name }) => ({
      key,
      name,
    }));

    await db
      .insert(categories)
      .values(values)
      .onConflictDoUpdate({ target: categories.key, set: { name: sql`excluded.name` } });

    logger.info("Categories seeded successfully.");
  } catch (error) {
    logger.error(error, "Unexpected error during Categories seeding");
  }
}
