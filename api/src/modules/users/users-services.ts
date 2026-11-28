import { BadgesService } from "@/modules/badges/badges-services";
import { MakersService } from "@/modules/makers/makers-services";
import { DB } from "@/db";
import { fileUploads, PublisherInsertModel, publishers, users } from "@/db/schemas";
import { toPublicUrl } from "@/utils/public-url";
import { and, eq, isNotNull } from "drizzle-orm";

import { errorLogger } from "@/utils/error-logger";

async function completeOnboarding(db: DB, values: Omit<PublisherInsertModel, "handle">) {
  return db.transaction(async (transaction) => {
    // Service helpers use the same query surface on a transaction as on DB.
    const tx = transaction as unknown as DB;
    const [user] = await tx.select({ name: users.name, onboardedAt: users.onboardedAt })
      .from(users).where(eq(users.id, values.userId)).for("update");
    // A profile may already exist after a retry or an older partial onboarding.
    const columns = { id: publishers.id, membershipNumber: publishers.membershipNumber };
    let [publisher] = await tx.select(columns).from(publishers)
      .where(eq(publishers.userId, values.userId));
    while (!publisher) {
      const handle = await MakersService.generateUniqueHandle(tx, user.name);
      // Two distinct accounts can choose the same handle concurrently.
      [publisher] = await tx.insert(publishers).values({ ...values, handle })
        .onConflictDoNothing({ target: publishers.handle }).returning(columns);
    }
    const badge = await BadgesService.awardFoundingBadge(tx, values.userId, publisher.membershipNumber);
    if (!user.onboardedAt) {
      await tx.update(users).set({ onboardedAt: new Date() }).where(eq(users.id, values.userId));
    }
    return { ...publisher, badges: badge ? [badge] : [] };
  });
}

/**
 * Points the account photo at one of the user's own finished avatar uploads,
 * or clears it. The URL is stored resolved, like the one Google sign-in
 * writes, because the session hands users.image to the browser as-is.
 * Returns undefined when the key is not such an upload.
 */
async function updateAvatar(db: DB, userId: string, key: string | null) {
  if (key) {
    const upload = await db.query.fileUploads.findFirst({
      where: and(
        eq(fileUploads.key, key),
        eq(fileUploads.userId, userId),
        eq(fileUploads.type, "user_avatar"),
        isNotNull(fileUploads.completedAt),
      ),
    });
    if (!upload) return undefined;
  }
  const image = toPublicUrl(key);
  await db.update(users).set({ image }).where(eq(users.id, userId));
  return image;
}

async function getEligibilityConfirmation(db: DB, userId: string) {
  const user = await db.query.users.findFirst({
    columns: { eligibilityConfirmedAt: true },
    where: eq(users.id, userId),
  });
  return user?.eligibilityConfirmedAt ?? null;
}

async function confirmEligibility(db: DB, userId: string) {
  const confirmedAt = new Date();
  const [user] = await db
    .update(users)
    .set({ eligibilityConfirmedAt: confirmedAt })
    .where(eq(users.id, userId))
    .returning({ eligibilityConfirmedAt: users.eligibilityConfirmedAt });
  return user?.eligibilityConfirmedAt ?? confirmedAt;
}

export const UserService = {
  completeOnboarding: errorLogger(completeOnboarding, "usersService.completeOnboarding"),
  updateAvatar: errorLogger(updateAvatar, "usersService.updateAvatar"),
  getEligibilityConfirmation: errorLogger(
    getEligibilityConfirmation,
    "usersService.getEligibilityConfirmation",
  ),
  confirmEligibility: errorLogger(confirmEligibility, "usersService.confirmEligibility"),
};
