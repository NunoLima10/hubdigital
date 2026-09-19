import { config } from "@/config";
import { DB } from "@/db";
import { users } from "@/db/schemas";
import { auth } from "@/lib/auth";
import { logger } from "@/utils/logger";
import { eq } from "drizzle-orm";

const DEMO_ADMIN = {
  email: "demo.admin@hubdigital.cv",
  password: "demo1234",
  name: "Demo admin",
};

/**
 * Dev-only convenience account that backs the admin app's prefilled login,
 * mirroring the demo publisher. The real first admin still comes from the
 * `ADMIN_SEED_*` seed — this one is never created outside development.
 *
 * Created through ordinary email sign-up and then promoted directly in the
 * database (the admin plugin's `createUser` needs an admin session), and
 * idempotent: an existing account is re-promoted, never recreated.
 */
export default async function seed(db: DB) {
  if (!config.isDev) return;

  const existing = await db.query.users.findFirst({
    where: eq(users.email, DEMO_ADMIN.email),
    columns: { id: true },
  });

  if (!existing) {
    await auth.api.signUpEmail({
      body: {
        email: DEMO_ADMIN.email,
        password: DEMO_ADMIN.password,
        name: DEMO_ADMIN.name,
      },
    });
  }

  const [promoted] = await db
    .update(users)
    .set({ role: "admin", emailVerified: true })
    .where(eq(users.email, DEMO_ADMIN.email))
    .returning({ id: users.id });

  if (!promoted) {
    logger.error("Demo admin seed: no user found for the demo admin after sign-up.");
    return;
  }

  logger.info({ email: DEMO_ADMIN.email }, "Demo admin user seeded.");
}
