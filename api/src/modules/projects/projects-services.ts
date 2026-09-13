import { DB } from "@/db";
import {
  comments,
  projects,
  projectUpvotes,
  publishers,
  users,
} from "@/db/schemas";
import { PG_ERR_UNIQUE_VIOLATION } from "@/utils/constants";
import { errorLogger } from "@/utils/error-logger";
import { toPublicUrl } from "@/utils/public-url";
import { slugify } from "@/utils/slugify";
import { WeekRange } from "@/utils/week";
import { ListSort } from "@hubdigital/shared";
import {
  SQL,
  and,
  arrayOverlaps,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  lt,
  or,
  sql,
} from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { PostgresError } from "postgres";

// Only the ids are needed to produce a count. Neither a deleted comment nor one
// hidden by staff belongs in a number shown on a card.
const liveCommentIds = {
  columns: { id: true },
  where: and(isNull(comments.deletedAt), isNull(comments.hiddenAt)),
} as const;

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
  logoUrl?: string | null;
  bannerImageUrl?: string | null;
  island: (typeof projects.$inferInsert)["island"];
};

type UpdateProjectInput = Partial<Omit<CreateProjectInput, "publisherId">>;

type SerializableProject = {
  upvotes: { userId: string }[];
  comments: { id: number }[];
  logoUrl?: string | null;
  bannerImageUrl?: string | null;
};

/**
 * Collapses the upvote rows into a count plus the current user's state, and
 * turns the stored R2 keys into public URLs. Everything the API hands out goes
 * through here so the two never drift apart.
 */
function serializeProject<T extends SerializableProject>(
  project: T,
  userId?: string
) {
  const { upvotes, comments: projectComments, ...rest } = project;

  return {
    ...rest,
    logoUrl: toPublicUrl(project.logoUrl),
    bannerImageUrl: toPublicUrl(project.bannerImageUrl),
    upvoteCount: upvotes.length,
    hasUpvoted: userId ? upvotes.some((upvote) => upvote.userId === userId) : false,
    commentCount: projectComments.length,
  };
}

type ModerationSource = {
  status?: string;
  rejectionReason?: string | null;
  shadowBannedAt?: string | null;
  shadowBanReason?: string | null;
};

/**
 * The half of the moderation state a maker is allowed to see about their own
 * work. A hide is deliberately not silent — the maker is told it happened and
 * why (specs/ADMIN.md §A4) — but only ever to the maker, never to a visitor.
 *
 * An account-level hide is reported the same way on each of that maker's
 * projects, since from their side the effect is identical.
 */
function ownerModerationFields(
  project: ModerationSource,
  owner?: { shadowBannedAt?: Date | string | null; shadowBanReason?: string | null } | null
) {
  const accountHiddenAt = owner?.shadowBannedAt
    ? new Date(owner.shadowBannedAt).toISOString()
    : null;

  const hiddenAt = project.shadowBannedAt ?? accountHiddenAt;

  return {
    rejectionReason: project.rejectionReason ?? null,
    hidden: Boolean(hiddenAt),
    hiddenAt,
    hiddenReason: project.shadowBannedAt
      ? project.shadowBanReason ?? null
      : owner?.shadowBanReason ?? null,
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
    .where(
      and(
        eq(projects.id, id),
        eq(projects.publisherId, publisherId),
        isNull(projects.deletedAt)
      )
    )
    .returning({ id: projects.id, slug: projects.slug });

  return result;
}

/** Drafts included — this is the maker's own dashboard. Deleted rows are not. */
async function listMyProjects(
  db: DB,
  publisherId: number,
  { limit, offset }: { limit: number; offset: number },
  userId?: string
) {
  const where = and(
    eq(projects.publisherId, publisherId),
    isNull(projects.deletedAt)
  );

  const [data, [{ total }]] = await Promise.all([
    db.query.projects.findMany({
      where,
      with: {
        category: true,
        upvotes: true,
        comments: liveCommentIds,
        // Needed only to report an account-level hide back to its owner.
        publisher: { with: { user: true } },
      },
      orderBy: desc(projects.createdAt),
      limit,
      offset,
    }),
    db.select({ total: count() }).from(projects).where(where),
  ]);

  return {
    data: data.map(({ publisher, ...project }) => ({
      ...serializeProject(project, userId),
      ...ownerModerationFields(project, publisher?.user),
    })),
    total,
  };
}

export type ProjectFilters = {
  /** Free text matched against the name and the short description. */
  q?: string;
  categoryId?: number;
  island?: (typeof projects.$inferSelect)["island"];
  pricing?: (typeof projects.$inferSelect)["pricing"];
  projectStage?: (typeof projects.$inferSelect)["projectStage"];
  platform?: (typeof projects.$inferSelect)["platform"];
};

/** Everything a visitor is allowed to see, narrowed by the caller's filters. */
function publicProjectFilter(
  week?: WeekRange | null,
  filters: ProjectFilters = {}
) {
  const conditions: (SQL | undefined)[] = [
    eq(projects.status, "published"),
    isNull(projects.deletedAt),
    // Hidden by staff (specs/ADMIN.md §A4). Its own upvote rows are left alone,
    // so unhiding restores the project with its count intact.
    isNull(projects.shadowBannedAt),
    // A hidden maker takes their projects with them. Written as a correlated
    // NOT EXISTS so this stays a pure predicate with no database handle.
    //
    // The subquery uses its own aliases and literal column names on purpose:
    // the relational query builder rewrites every interpolated column to the
    // root table it is aliasing, so `${users.id}` inside here would come out as
    // `projects.user_id`. Only the correlating reference to `projects` is
    // interpolated, because that one does belong to the root.
    sql`not exists (
      select 1
      from ${publishers} as p
      inner join ${users} as u on u.id = p.user_id
      where p.id = ${projects.publisherId}
        and u.shadow_banned_at is not null
    )`,
  ];

  if (week) {
    conditions.push(
      gte(projects.launchedAt, week.start.toISOString()),
      lt(projects.launchedAt, week.end.toISOString())
    );
  }

  if (filters.q) {
    // ILIKE is enough at launch volume; swap in a tsvector column with a GIN
    // index when the catalogue outgrows a sequential scan.
    const pattern = `%${filters.q}%`;
    conditions.push(
      or(
        ilike(projects.name, pattern),
        ilike(projects.shortDescription, pattern)
      )
    );
  }

  if (filters.categoryId) {
    conditions.push(eq(projects.categoryId, filters.categoryId));
  }
  if (filters.island) {
    conditions.push(eq(projects.island, filters.island));
  }
  if (filters.pricing) {
    conditions.push(eq(projects.pricing, filters.pricing));
  }
  if (filters.projectStage) {
    conditions.push(eq(projects.projectStage, filters.projectStage));
  }
  if (filters.platform?.length) {
    // platform is an array column, so match projects supporting any of them.
    conditions.push(arrayOverlaps(projects.platform, filters.platform));
  }

  return and(...conditions);
}

type ListProjectsOptions = ProjectFilters & {
  limit: number;
  offset: number;
  sort: ListSort;
  /** Restricts the listing to one weekly cycle; null lists every week. */
  week?: WeekRange | null;
};

async function listProjects(
  db: DB,
  { limit, offset, sort, week, ...filters }: ListProjectsOptions,
  userId?: string
) {
  const where = publicProjectFilter(week, filters);

  const [{ total }] = await db
    .select({ total: count() })
    .from(projects)
    .where(where);

  // Ranking by vote count is done in memory rather than in SQL. A weekly window
  // holds at most a handful of launches, and the upvote rows are already loaded
  // to compute `hasUpvoted`, so a correlated subquery would buy nothing. Revisit
  // if `period=all` ever has to rank thousands of rows.
  if (sort === "upvotes") {
    const all = await db.query.projects.findMany({
      where,
      with: { category: true, upvotes: true, comments: liveCommentIds },
    });

    const ranked = all
      .map((project) => serializeProject(project, userId))
      .sort(
        (a, b) =>
          b.upvoteCount - a.upvoteCount ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return { data: ranked.slice(offset, offset + limit), total };
  }

  const data = await db.query.projects.findMany({
    where,
    with: { category: true, upvotes: true, comments: liveCommentIds },
    orderBy: [desc(projects.launchedAt), desc(projects.createdAt)],
    limit,
    offset,
  });

  return { data: data.map((project) => serializeProject(project, userId)), total };
}

async function getProjectBySlug(db: DB, slug: string, userId?: string) {
  const result = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
    with: {
      category: true,
      publisher: { with: { user: true } },
      upvotes: true,
      comments: liveCommentIds,
    },
  });

  if (!result) return null;

  const { publisher, ...project } = result;

  // A draft is visible only to the maker who owns it, so they can preview a
  // project before putting it in front of anyone else. Deleted rows are gone
  // for everybody.
  const isOwner = Boolean(userId && publisher?.user?.id === userId);

  // Hidden by staff, or belonging to a hidden maker: the owner still sees it —
  // and is told why below — while for everyone else it is a 404. A visitor must
  // not be able to tell a hidden project from one that never existed.
  const hiddenAt =
    project.shadowBannedAt ?? publisher?.user?.shadowBannedAt ?? null;

  const isVisible =
    !project.deletedAt &&
    (project.status === "published" || isOwner) &&
    (!hiddenAt || isOwner);

  if (!isVisible) return null;

  return {
    ...serializeProject(project, userId),
    ...(isOwner ? ownerModerationFields(project, publisher?.user) : {}),
    author: publisher?.user
      ? {
          id: publisher.user.id,
          name: publisher.user.name,
          image: publisher.user.image,
          handle: publisher.handle,
        }
      : null,
  };
}

/**
 * Moves a draft into the current weekly cycle, or into the review queue when
 * the gate is on. Publishing is idempotent: calling it on a live project
 * returns it unchanged rather than resetting its launch date, which would
 * otherwise let a maker jump into a fresh ranking window.
 *
 * The caller decides whether review applies — it depends on a platform setting
 * and on whether this publisher is trusted, neither of which belongs in a
 * query.
 */
async function publishProject(
  db: DB,
  id: number,
  publisherId: number,
  { requireReview = false }: { requireReview?: boolean } = {}
) {
  const existing = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, id),
      eq(projects.publisherId, publisherId),
      isNull(projects.deletedAt)
    ),
    columns: { id: true, slug: true, status: true },
  });

  if (!existing) return null;
  // Already live, or already waiting on a moderator: nothing to do either way.
  if (existing.status === "published" || existing.status === "pending") {
    return existing;
  }

  const now = new Date().toISOString();

  const [result] = await db
    .update(projects)
    .set(
      requireReview
        ? {
            status: "pending",
            queuedAt: now,
            // A resubmission starts clean; the previous rejection has been
            // answered by the edit that led here.
            rejectionReason: null,
            updatedAt: now,
          }
        : {
            status: "published",
            publishedAt: now,
            launchedAt: now,
            updatedAt: now,
          }
    )
    .where(and(eq(projects.id, id), eq(projects.publisherId, publisherId)))
    .returning({
      id: projects.id,
      slug: projects.slug,
      status: projects.status,
    });

  return result;
}

/**
 * Soft delete: the row stays so upvote history and slugs are not silently
 * reused, but it disappears from every listing.
 */
async function deleteProject(db: DB, id: number, publisherId: number) {
  const now = new Date().toISOString();

  const [result] = await db
    .update(projects)
    .set({ deletedAt: now, updatedAt: now })
    .where(
      and(
        eq(projects.id, id),
        eq(projects.publisherId, publisherId),
        isNull(projects.deletedAt)
      )
    )
    .returning({ id: projects.id });

  return result;
}

type UpvoteContext = {
  ipAddress?: string;
  userAgent?: string;
};

async function toggleUpvote(
  db: DB,
  projectId: number,
  userId: string,
  context: UpvoteContext = {}
) {
  // Only a live project can be voted on: no stuffing votes into a draft before
  // it launches, and no voting on something that has been removed.
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.status, "published"),
      isNull(projects.deletedAt)
    ),
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
    await db.insert(projectUpvotes).values({
      projectId,
      userId,
      ipAddress: context.ipAddress?.slice(0, 64),
      userAgent: context.userAgent,
    });
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
  publishProject: errorLogger(publishProject, "projectsService.publishProject"),
  deleteProject: errorLogger(deleteProject, "projectsService.deleteProject"),
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
