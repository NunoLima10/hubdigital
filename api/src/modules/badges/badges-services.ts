import { DB } from "@/db";
import { badges, userBadges } from "@/db/schemas";
import { errorLogger } from "@/utils/error-logger";
import {
  badgeCatalog,
  foundingBadgeFor,
  type BadgeKey,
} from "@hubdigital/shared";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";

const bySortOrder = (a: { key: BadgeKey }, b: { key: BadgeKey }) =>
  badgeCatalog[a.key].sortOrder - badgeCatalog[b.key].sortOrder;

/**
 * Features the user's best badge when they have none featured yet, so a first
 * badge shows up without a trip to settings. A user who chose to hide their
 * badges keeps an unfeatured set until they earn something new.
 */
async function featureIfNoneFeatured(db: DB, userId: string, key: BadgeKey) {
  const featured = await db.query.userBadges.findFirst({
    where: and(eq(userBadges.userId, userId), eq(userBadges.featured, true)),
    columns: { id: true },
  });
  if (featured) return;

  await db
    .update(userBadges)
    .set({ featured: true })
    .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeKey, key)));
}

/**
 * Inserts the award, or does nothing when the user already holds it. Returns
 * whether a new award was made.
 */
async function award(
  db: DB,
  userId: string,
  key: BadgeKey,
  awardedBy: string | null = null,
) {
  return db.transaction(async (trx) => {
    // Same query surface; see withAudit for why the handle is cast.
    const tx = trx as unknown as DB;
    const [created] = await tx
      .insert(userBadges)
      .values({ userId, badgeKey: key, awardedBy })
      .onConflictDoNothing()
      .returning({ id: userBadges.id });

    if (!created) return false;

    await featureIfNoneFeatured(tx, userId, key);
    return true;
  });
}

/** Applies the automatic join-order rule; returns the badge earned, if any. */
async function awardFoundingBadge(
  db: DB,
  userId: string,
  membershipNumber: number,
) {
  const key = foundingBadgeFor(membershipNumber);
  if (!key) return null;

  await award(db, userId, key);
  return key;
}

type GrantResult = "granted" | "already_held" | "not_manual";

/** Staff grant. Automatic badges follow their rule and can't be handed out. */
async function grant(
  db: DB,
  userId: string,
  key: BadgeKey,
  actorId: string,
): Promise<GrantResult> {
  const badge = await db.query.badges.findFirst({
    where: eq(badges.key, key),
    columns: { awardMode: true },
  });
  if (!badge || badge.awardMode !== "manual") return "not_manual";

  return (await award(db, userId, key, actorId)) ? "granted" : "already_held";
}

/**
 * Removes a staff-granted badge. If it was the featured one, the user's next
 * best badge takes its place, as it would have on a first award.
 */
async function revoke(db: DB, userId: string, key: BadgeKey) {
  return db.transaction(async (trx) => {
    // Same query surface; see withAudit for why the handle is cast.
    const tx = trx as unknown as DB;
    const badge = await tx.query.badges.findFirst({
      where: eq(badges.key, key),
      columns: { awardMode: true },
    });
    if (!badge || badge.awardMode !== "manual") return false;

    const [removed] = await tx
      .delete(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeKey, key)))
      .returning({ featured: userBadges.featured });

    if (!removed) return false;

    if (removed.featured) {
      const [next] = (await listForUser(tx, userId)).sort(bySortOrder);
      if (next) await featureIfNoneFeatured(tx, userId, next.key);
    }

    return true;
  });
}

async function listForUser(db: DB, userId: string) {
  const rows = await db.query.userBadges.findMany({
    where: eq(userBadges.userId, userId),
    orderBy: asc(userBadges.awardedAt),
  });

  return rows
    .map((row) => ({
      key: row.badgeKey as BadgeKey,
      // Postgres text ("2026-11-07 23:15:22+00") isn't parsed by every
      // browser; hand out ISO 8601.
      awardedAt: new Date(row.awardedAt).toISOString(),
      featured: row.featured,
      seenAt: row.seenAt ? new Date(row.seenAt).toISOString() : null,
    }))
    .filter((row) => row.key in badgeCatalog)
    .sort(bySortOrder);
}

/** The public view: what a user holds and which one they feature. */
async function publicBadgesFor(db: DB, userId: string) {
  const rows = await listForUser(db, userId);

  return {
    badges: rows.map(({ key, awardedAt }) => ({ key, awardedAt })),
    featuredBadge: rows.find((row) => row.featured)?.key ?? null,
  };
}

/** Featured badge per user, for lists such as a comment thread. */
async function featuredFor(db: DB, userIds: string[]) {
  const featured = new Map<string, BadgeKey>();
  if (userIds.length === 0) return featured;

  const rows = await db.query.userBadges.findMany({
    where: and(
      inArray(userBadges.userId, [...new Set(userIds)]),
      eq(userBadges.featured, true),
    ),
    columns: { userId: true, badgeKey: true },
  });

  for (const row of rows) {
    if (row.badgeKey in badgeCatalog)
      featured.set(row.userId, row.badgeKey as BadgeKey);
  }

  return featured;
}

/**
 * Sets the featured badge, or clears it with null. Returns false when the user
 * does not hold the badge.
 */
async function setFeatured(db: DB, userId: string, key: BadgeKey | null) {
  return db.transaction(async (trx) => {
    // Same query surface; see withAudit for why the handle is cast.
    const tx = trx as unknown as DB;
    if (key) {
      const held = await tx.query.userBadges.findFirst({
        where: and(eq(userBadges.userId, userId), eq(userBadges.badgeKey, key)),
        columns: { id: true },
      });
      if (!held) return false;
    }

    // Unfeature first: the partial unique index allows one featured row.
    await tx
      .update(userBadges)
      .set({ featured: false })
      .where(and(eq(userBadges.userId, userId), eq(userBadges.featured, true)));

    if (key) {
      await tx
        .update(userBadges)
        .set({ featured: true })
        .where(
          and(eq(userBadges.userId, userId), eq(userBadges.badgeKey, key)),
        );
    }

    return true;
  });
}

async function markSeen(db: DB, userId: string, keys: BadgeKey[]) {
  await db
    .update(userBadges)
    .set({ seenAt: new Date().toISOString() })
    .where(
      and(
        eq(userBadges.userId, userId),
        inArray(userBadges.badgeKey, keys),
        isNull(userBadges.seenAt),
      ),
    );
}

export const BadgesService = {
  awardFoundingBadge: errorLogger(
    awardFoundingBadge,
    "badgesService.awardFoundingBadge",
  ),
  grant: errorLogger(grant, "badgesService.grant"),
  revoke: errorLogger(revoke, "badgesService.revoke"),
  listForUser: errorLogger(listForUser, "badgesService.listForUser"),
  publicBadgesFor: errorLogger(publicBadgesFor, "badgesService.publicBadgesFor"),
  featuredFor: errorLogger(featuredFor, "badgesService.featuredFor"),
  setFeatured: errorLogger(setFeatured, "badgesService.setFeatured"),
  markSeen: errorLogger(markSeen, "badgesService.markSeen"),
};
