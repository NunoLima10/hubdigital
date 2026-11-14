import { config } from '@/config';
import { setupDB } from '@/db';
import { RundSeeding } from '@/db/seeds';
import { logger } from '@/utils/logger';
import 'dotenv/config';

async function main() {
  try {
    if (!config.DB_SEEDING) {
      logger.info('Skipping seeding because DB_SEEDING is not set to "true"');
      return;
    }

    const { db } = await setupDB(config.DATABASE_URL, {
      seeding: true,
    });

    await RundSeeding(db);

    await db.$client.end();
    logger.info('Seeding finished successfully');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Seeding failed');
    process.exit(1);
  }
}

main();
