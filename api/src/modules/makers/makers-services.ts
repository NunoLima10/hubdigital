import { DB } from "@/db";
import { projects, publishers, users } from "@/db/schemas";
import { PG_ERR_UNIQUE_VIOLATION } from "@/utils/constants";
import { errorLogger } from "@/utils/error-logger";
import { toPublicUrl } from "@/utils/public-url";
import { slugify } from "@/utils/slugify";
import { MakerProfileUpdate } from "@hubdigital/shared";
import { and, desc, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { PostgresError } from "postgres";

/**
 * Derives a URL-safe handle from a display name, falling back to a generic stem
 * when the name has nothing usable in it (e.g. it is all punctuation).
 */
export function handleFromName(name: string) {
  const base = slugify(name).slice(0, 24).replace(/^-+|-+$/g, "");

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
      projects: {
        where: and(
          eq(projects.status, "published"),
          isNull(projects.deletedAt)
        ),
        with: { category: true, upvotes: true, comments: { columns: { id: true } } },
        orderBy: desc(projects.launchedAt),
      },
    },
  });

  if (!publisher || !publisher.user) return null;

  const publishedProjects = publisher.projects.map((project) => {
    const { upvotes, comments, ...rest } = project;

    return {
      ...rest,
      logoUrl: toPublicUrl(project.logoUrl),
      bannerImageUrl: toPublicUrl(project.bannerImageUrl),
      upvoteCount: upvotes.length,
      hasUpvoted: viewerId
        ? upvotes.some((upvote) => upvote.userId === viewerId)
        : false,
      commentCount: comments.length,
    };
  });

  return {
    id: publisher.id,
    handle: publisher.handle,
    name: publisher.user.name,
    image: publisher.user.image,
    bio: publisher.bio,
    websiteUrl: publisher.websiteUrl,
    githubUrl: publisher.githubUrl,
    linkedinUrl: publisher.linkedinUrl,
    totalUpvotes: publishedProjects.reduce(
      (total, project) => total + project.upvoteCount,
      0
    ),
    projectCount: publishedProjects.length,
    joinedAt: publisher.createdAt,
    projects: publishedProjects,
  };
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
  input: MakerProfileUpdate
) {
  const values = {
    ...input,
    // An empty string from a cleared form field means "remove this link".
    websiteUrl: input.websiteUrl || null,
    githubUrl: input.githubUrl || null,
    linkedinUrl: input.linkedinUrl || null,
    updatedAt: new Date().toISOString(),
  };

  try {
    const [updated] = await db
      .update(publishers)
      .set(values)
      .where(eq(publishers.userId, userId))
      .returning({ handle: publishers.handle });

    return updated ? { handle: updated.handle } : null;
  } catch (error) {
    if (
      error instanceof PostgresError &&
      error.code === PG_ERR_UNIQUE_VIOLATION
    ) {
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

export const MakersService = {
  getProfileByHandle: errorLogger(
    getProfileByHandle,
    "makersService.getProfileByHandle"
  ),
  getProfileByUserId: errorLogger(
    getProfileByUserId,
    "makersService.getProfileByUserId"
  ),
  updateProfile: errorLogger(updateProfile, "makersService.updateProfile"),
  findUserName: errorLogger(findUserName, "makersService.findUserName"),
  generateUniqueHandle: errorLogger(
    generateUniqueHandle,
    "makersService.generateUniqueHandle"
  ),
};
