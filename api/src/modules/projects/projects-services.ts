import { DB } from "@/db";
import { publishers, projects, projectUpvotes } from "@/db/schemas";
import { PG_ERR_UNIQUE_VIOLATION } from "@/utils/constants";
import { errorLogger } from "@/utils/error-logger";
import { slugify } from "@/utils/slugify";
import { and, count, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { PostgresError } from "postgres";

type CreateProjectInput = {
  publisherId: number;
  name: string;
  shortDescription: string;
  description?: string;
  websiteUrl: string;
  githubUrl?: string;
  pricing: (typeof projects.$inferInsert)["pricing"];
  platform: (typeof projects.$inferInsert)["platform"];
  businessModel: (typeof projects.$inferInsert)["businessModel"];
  access: (typeof projects.$inferInsert)["access"];
  projectStage: (typeof projects.$inferInsert)["projectStage"];
  audienceStage: (typeof projects.$inferInsert)["audienceStage"];
  categoryId: number;
};

type UpdateProjectInput = Partial<Omit<CreateProjectInput, "publisherId">>;

function withUpvotes<T extends { upvotes: { userId: string }[] }>(
  project: T,
  userId?: string
) {
  const { upvotes, ...rest } = project;

  return {
    ...rest,
    upvoteCount: upvotes.length,
    hasUpvoted: userId ? upvotes.some((upvote) => upvote.userId === userId) : false,
  };
}

async function findPublisherByUserId(db: DB, userId: string) {
  return db.query.publishers.findFirst({
    where: eq(publishers.userId, userId),
  });
}

async function insertProject(db: DB, input: CreateProjectInput, slug: string) {
  const [result] = await db
    .insert(projects)
    .values({ ...input, slug })
    .returning({ id: projects.id, slug: projects.slug });

  return result;
}

async function createProject(db: DB, input: CreateProjectInput) {
  const base = slugify(input.name) || "projeto";

  try {
    return await insertProject(db, input, base);
  } catch (error) {
    if (
      error instanceof PostgresError &&
      error.code === PG_ERR_UNIQUE_VIOLATION
    ) {
      return await insertProject(
        db,
        input,
        `${base}-${randomUUID().slice(0, 6)}`
      );
    }

    throw error;
  }
}

async function updateProject(
  db: DB,
  id: number,
  publisherId: number,
  input: UpdateProjectInput
) {
  const [result] = await db
    .update(projects)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(and(eq(projects.id, id), eq(projects.publisherId, publisherId)))
    .returning({ id: projects.id, slug: projects.slug });

  return result;
}

async function listMyProjects(
  db: DB,
  publisherId: number,
  { limit, offset }: { limit: number; offset: number },
  userId?: string
) {
  const [data, [{ total }]] = await Promise.all([
    db.query.projects.findMany({
      where: eq(projects.publisherId, publisherId),
      with: { category: true, upvotes: true },
      orderBy: desc(projects.createdAt),
      limit,
      offset,
    }),
    db
      .select({ total: count() })
      .from(projects)
      .where(eq(projects.publisherId, publisherId)),
  ]);

  return { data: data.map((project) => withUpvotes(project, userId)), total };
}

async function listProjects(
  db: DB,
  { limit, offset }: { limit: number; offset: number },
  userId?: string
) {
  const [data, [{ total }]] = await Promise.all([
    db.query.projects.findMany({
      with: { category: true, upvotes: true },
      orderBy: desc(projects.createdAt),
      limit,
      offset,
    }),
    db.select({ total: count() }).from(projects),
  ]);

  return { data: data.map((project) => withUpvotes(project, userId)), total };
}

async function getProjectBySlug(db: DB, slug: string, userId?: string) {
  const result = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
    with: {
      category: true,
      publisher: { with: { user: true } },
      upvotes: true,
    },
  });

  if (!result) return null;

  const { publisher, ...project } = result;

  return {
    ...withUpvotes(project, userId),
    author: publisher?.user
      ? {
          id: publisher.user.id,
          name: publisher.user.name,
          image: publisher.user.image,
        }
      : null,
  };
}

async function toggleUpvote(db: DB, projectId: number, userId: string) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { id: true },
  });

  if (!project) return null;

  const existing = await db.query.projectUpvotes.findFirst({
    where: and(
      eq(projectUpvotes.projectId, projectId),
      eq(projectUpvotes.userId, userId)
    ),
  });

  if (existing) {
    await db.delete(projectUpvotes).where(eq(projectUpvotes.id, existing.id));
  } else {
    await db.insert(projectUpvotes).values({ projectId, userId });
  }

  const [{ upvoteCount }] = await db
    .select({ upvoteCount: count() })
    .from(projectUpvotes)
    .where(eq(projectUpvotes.projectId, projectId));

  return { upvoted: !existing, upvoteCount };
}

export const ProjectsService = {
  findPublisherByUserId: errorLogger(
    findPublisherByUserId,
    "projectsService.findPublisherByUserId"
  ),
  createProject: errorLogger(createProject, "projectsService.createProject"),
  updateProject: errorLogger(updateProject, "projectsService.updateProject"),
  listMyProjects: errorLogger(
    listMyProjects,
    "projectsService.listMyProjects"
  ),
  listProjects: errorLogger(listProjects, "projectsService.listProjects"),
  getProjectBySlug: errorLogger(
    getProjectBySlug,
    "projectsService.getProjectBySlug"
  ),
  toggleUpvote: errorLogger(toggleUpvote, "projectsService.toggleUpvote"),
};
