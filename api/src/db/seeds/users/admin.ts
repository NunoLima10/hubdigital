import { config } from "@/config";
import { DB } from "@/db";
import { users } from "@/db/schemas";
import { auth } from "@/lib/auth";
import { logger } from "@/utils/logger";
import { eq } from "drizzle-orm";

/**
 * Creates the first admin from the `ADMIN_SEED_*` variables, which have been
 * declared and validated in config since the project started without anything
 * ever reading them.
 *
 * The account is created through ordinary email sign-up and then promoted
 * directly in the database, rather than through the admin plugin's
 * `createUser`, which needs an admin session to already exist — the
 * chicken-and-egg this seed exists to break.
 *
 * Idempotent: an account that is already there is promoted, never recreated,
 * so re-running the seed cannot reset a password that has since been changed.
 */
export default async function seed(db: DB) {
  const { ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD, ADMIN_SEED_NAME } = config;

  if (!ADMIN_SEED_EMAIL || !ADMIN_SEED_PASSWORD || !ADMIN_SEED_NAME) {
    logger.info("ADMIN_SEED_* not set — skipping the admin seed.");
    return;
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, ADMIN_SEED_EMAIL),
    columns: { id: true, role: true },
  });

  if (!existing) {
    await auth.api.signUpEmail({
      body: {
        email: ADMIN_SEED_EMAIL,
        password: ADMIN_SEED_PASSWORD,
        name: ADMIN_SEED_NAME,
      },
    });
  }

  const [promoted] = await db
    .update(users)
    .set({ role: "admin", emailVerified: true })
    .where(eq(users.email, ADMIN_SEED_EMAIL))
    .returning({ id: users.id });

  if (!promoted) {
    logger.error(
      "Admin seed: no user found for ADMIN_SEED_EMAIL after sign-up."
    );
    return;
  }

  logger.info(
    { email: ADMIN_SEED_EMAIL, existed: Boolean(existing) },
    "Admin user seeded."
  );
}
