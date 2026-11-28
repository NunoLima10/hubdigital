import { BadgesService } from "@/modules/badges/badges-services";
import {
  serializeProjectCategories,
  secondaryCategoriesWith,
} from "@/utils/project-categories";
import { DB } from "@/db";
import { projects, publishers, users, projectMembers, userBadges } from "@/db/schemas";
import { PG_ERR_UNIQUE_VIOLATION } from "@/utils/constants";
import { errorLogger } from "@/utils/error-logger";
import { getPostgresError } from "@/utils/postgres-error";
import { serializeProjectLinks } from "@/utils/project-links";
import { withLocation } from "@/utils/location";
import {
  projectEngagementExtras,
  publicProjectConditions,
} from "@/utils/project-visibility";
import { toPublicUrl } from "@/utils/public-url";
import { slugify } from "@/utils/slugify";
import { MakerProfileUpdate } from "@hubdigital/shared";
import { and, asc, count, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { MakerPreferences } from "./makers-schemas";

/**
 * Derives a URL-safe handle from a display name, falling back to a generic stem
 * when the name has nothing usable in it (e.g. it is all punctuation).
 */
export function handleFromName(name: string) {
  const base = slugify(name)
    .slice(0, 24)
    .replace(/^-+|-+$/g, "");

  return base.length >= 3 ? base : `maker-${randomUUID().slice(0, 6)}`;
}

/**
 * Handles are unique, so a collision falls back to a suffixed variant rather
 * than failing the whole onboarding.
 */
export async function generateUniqueHandle(db: DB, name: string) {
  const base = handleFromName(name);

  const taken = await db.query.publishers.findFirst({
    where: eq(publishers.handle, base),
    columns: { id: true },
  });

  return taken ? `${base}-${randomUUID().slice(0, 4)}` : base;
}

async function getProfileByHandle(db: DB, handle: string, viewerId?: string) {
  const publisher = await db.query.publishers.findFirst({
    where: eq(publishers.handle, handle),
    with: {
      user: true,
    },
  });

  if (!publisher || !publisher.user || publisher.user.shadowBannedAt)
    return null;

  const creditedProjects = await db.query.projects.findMany({
    where: and(
      publicProjectConditions,
      or(
        eq(projects.publisherId, publisher.id),
        sql`exists(select 1 from project_members pm where pm.project_id=${projects.id} and pm.user_id=${publisher.userId} and pm.status='accepted')`,
      ),
    ),
    with: {
      links: true,
      category: true,
      secondaryMemberships: secondaryCategoriesWith,
    },
    extras: projectEngagementExtras(viewerId),
    orderBy: desc(projects.publishedAt),
  });

  const publishedProjects = creditedProjects.map((project) => {
    const { secondaryMemberships, logoKey, ...rest } = project;

    return {
      ...withLocation(rest),
      ...serializeProjectCategories(secondaryMemberships),
      links: serializeProjectLinks(project.links),
      logoUrl: toPublicUrl(logoKey),
    };
  });
  const memberships = await db.query.projectMembers.findMany({
    where: and(
      eq(projectMembers.userId, publisher.userId),
      eq(projectMembers.status, "accepted"),
    ),
    columns: { projectId: true, role: true },
  });
  const roles = new Map(memberships.map((item) => [item.projectId, item.role]));

  return {
    id: publisher.id,
    handle: publisher.handle,
    name: publisher.user.name,
    image: publisher.user.image,
    bio: publisher.bio,
    websiteUrl: publisher.websiteUrl,
    githubUrl: publisher.githubUrl,
    linkedinUrl: publisher.linkedinUrl,
    instagramUrl: publisher.instagramUrl,
    discordUrl: publisher.discordUrl,
    totalUpvotes: publishedProjects.reduce(
      (total, project) => total + project.upvoteCount,
      0,
    ),
    projectCount: publishedProjects.length,
    membershipNumber: publisher.membershipNumber,
    ...(await BadgesService.publicBadgesFor(db, publisher.userId)),
    joinedAt: publisher.createdAt,
    projects: publishedProjects,
    ownedProjects: publishedProjects.filter(
      (project) => project.publisherId === publisher.id,
    ),
    collaborations: publishedProjects
      .filter((project) => project.publisherId !== publisher.id)
      .map((project) => ({
        ...project,
        contributionRole: roles.get(project.id) ?? null,
      })),
  };
}

/**
 * The public founding roll follows the immutable membership number. Hidden
 * accounts do not leave behind a public name or avatar, but the original
 * numbers remain untouched so every membership number stays meaningful.
 */
async function getFoundingMakers(
  db: DB,
  pagination: { limit: number; offset: number },
) {
  const visible = isNull(users.shadowBannedAt);
  const [rows, [summary]] = await Promise.all([
    db
      .select({
        userId: publishers.userId,
        handle: publishers.handle,
        name: users.name,
        image: users.image,
        membershipNumber: publishers.membershipNumber,
      })
      .from(publishers)
      .innerJoin(users, eq(publishers.userId, users.id))
      .where(visible)
      .orderBy(asc(publishers.membershipNumber))
      .limit(pagination.limit)
      .offset(pagination.offset),
    db
      .select({ total: count() })
      .from(publishers)
      .innerJoin(users, eq(publishers.userId, users.id))
      .where(visible),
  ]);

  const featured = await BadgesService.featuredFor(
    db,
    rows.map((row) => row.userId),
  );
  const data = rows.map(({ userId, ...maker }) => ({
    ...maker,
    featuredBadge: featured.get(userId) ?? null,
  }));

  return { data, total: summary?.total ?? 0 };
}

/**
 * The people behind the platform, for the sponsorship page: everyone holding
 * the `founder` or `maintainer` badge who has a public maker profile.
 */
async function getTeam(db: DB) {
  const rows = await db
    .select({
      badgeKey: userBadges.badgeKey,
      handle: publishers.handle,
      name: users.name,
      image: users.image,
      bio: publishers.bio,
      githubUrl: publishers.githubUrl,
      awardedAt: userBadges.awardedAt,
    })
    .from(userBadges)
    .innerJoin(users, eq(userBadges.userId, users.id))
    .innerJoin(publishers, eq(publishers.userId, users.id))
    .where(
      and(
        inArray(userBadges.badgeKey, ["founder", "maintainer"]),
        isNull(users.shadowBannedAt),
      ),
    )
    .orderBy(asc(userBadges.awardedAt));

  const pick = (key: string) =>
    rows
      .filter((row) => row.badgeKey === key)
      .map(({ badgeKey: _key, awardedAt: _at, ...member }) => member);
  return { founders: pick("founder"), maintainers: pick("maintainer") };
}

async function getProfileByUserId(db: DB, userId: string) {
  const publisher = await db.query.publishers.findFirst({
    where: eq(publishers.userId, userId),
    columns: { handle: true },
  });

  return publisher?.handle ?? null;
}

/** Returns "taken" so the controller can answer 409 instead of a blank 500. */
async function updateProfile(
  db: DB,
  userId: string,
  input: MakerProfileUpdate,
) {
  const values = {
    ...input,
    // An empty string from a cleared form field means "remove this link".
    websiteUrl: input.websiteUrl || null,
    githubUrl: input.githubUrl || null,
    linkedinUrl: input.linkedinUrl || null,
    instagramUrl: input.instagramUrl || null,
    discordUrl: input.discordUrl || null,
  };

  try {
    const [updated] = await db
      .update(publishers)
      .set(values)
      .where(eq(publishers.userId, userId))
      .returning({ handle: publishers.handle });

    return updated ? { handle: updated.handle } : null;
  } catch (error) {
    if (getPostgresError(error)?.code === PG_ERR_UNIQUE_VIOLATION) {
      return "taken" as const;
    }

    throw error;
  }
}

async function findUserName(db: DB, userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { name: true },
  });

  return user?.name ?? "";
}

const preferenceColumns = {
  profileResponses: true,
  objectiveResponses: true,
  locationResponse: true,
  diasporaCountry: true,
  originIsland: true,
  foundUsByResponse: true,
} as const;

async function getPreferences(db: DB, userId: string) {
  return db.query.publishers.findFirst({
    where: eq(publishers.userId, userId),
    columns: preferenceColumns,
  });
}

async function updatePreferences(
  db: DB,
  userId: string,
  input: MakerPreferences,
) {
  const inDiaspora = input.locationResponse === "diaspora";
  const preferences = {
    ...input,
    diasporaCountry: inDiaspora ? input.diasporaCountry : null,
    originIsland: inDiaspora ? input.originIsland : null,
  };
  const [updated] = await db
    .update(publishers)
    .set({ ...preferences, updatedAt: new Date().toISOString() })
    .where(eq(publishers.userId, userId))
    .returning({
      profileResponses: publishers.profileResponses,
      objectiveResponses: publishers.objectiveResponses,
      locationResponse: publishers.locationResponse,
      diasporaCountry: publishers.diasporaCountry,
      originIsland: publishers.originIsland,
      foundUsByResponse: publishers.foundUsByResponse,
    });

  return updated ?? null;
}

export const MakersService = {
  getFoundingMakers: errorLogger(
    getFoundingMakers,
    "makersService.getFoundingMakers",
  ),
  getTeam: errorLogger(getTeam, "makersService.getTeam"),
  getProfileByHandle: errorLogger(
    getProfileByHandle,
    "makersService.getProfileByHandle",
  ),
  getProfileByUserId: errorLogger(
    getProfileByUserId,
    "makersService.getProfileByUserId",
  ),
  updateProfile: errorLogger(updateProfile, "makersService.updateProfile"),
  findUserName: errorLogger(findUserName, "makersService.findUserName"),
  getPreferences: errorLogger(getPreferences, "makersService.getPreferences"),
  updatePreferences: errorLogger(
    updatePreferences,
    "makersService.updatePreferences",
  ),
  generateUniqueHandle: errorLogger(
    generateUniqueHandle,
    "makersService.generateUniqueHandle",
  ),
};
