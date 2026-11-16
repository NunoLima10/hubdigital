import { config } from '@/config';
import { setupDB } from '@/db';
import { seedReferenceData } from '@/db/seeds';
import { logger } from '@/utils/logger';

/**
 * Production seed: categories, badges and the optional first admin, nothing
 * else. Never touches demo accounts or sample projects, whatever NODE_ENV says,
 * so it is safe to run after every migration on any environment.
 *
 * Runs from the compiled build (`pnpm --filter @hubdigital/api db:seed:prod`)
 * and reads variables from the process environment, not from a .env file.
 */
async function main() {
  const { db } = await setupDB(config.DATABASE_URL, { seeding: true });

  try {
    await seedReferenceData(db);
    logger.info('Production seed finished successfully');
  } finally {
    await db.$client.end();
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    logger.error({ error }, 'Production seed failed');
    process.exit(1);
  },
);
