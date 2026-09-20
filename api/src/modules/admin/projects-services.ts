import { DB } from "@/db";
import { comments, projects, publishers } from "@/db/schemas";
import { errorLogger } from "@/utils/error-logger";
import { withLocation } from "@/utils/location";
import { toPublicUrl } from "@/utils/public-url";
import { ProjectStatus } from "@hubdigital/shared";
import {
  SQL,
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  isNull,
  lte,
  or,
} from "drizzle-orm";

const liveCommentIds = {
  columns: { id: true },
  where: isNull(comments.deletedAt),
} as const;

const projectWith = {
  category: true,
  upvotes: { columns: { userId: true } },
  comments: liveCommentIds,
  publisher: { with: { user: true } },
} as const;

type ProjectRow = Awaited<
  ReturnType<typeof queryProjects>
>[number];

function queryProjects(db: DB, args: Parameters<DB["query"]["projects"]["findMany"]>[0]) {
  return db.query.projects.findMany({ ...args, with: projectWith });
}

/** The admin view: nothing is filtered out, and moderation state is explicit. */
function serializeAdminProject(project: ProjectRow) {
  const { upvotes, comments: projectComments, publisher, ...rest } = project;

  return {
    ...withLocation(rest),
    logoUrl: toPublicUrl(project.logoUrl),
    bannerImageUrl: toPublicUrl(project.bannerImageUrl),
    upvoteCount: upvotes.length,
    commentCount: projectComments.length,
    publisher: publisher
      ? {
          id: publisher.id,
          handle: publisher.handle,
          bio: publisher.bio,
          trustedAt: publisher.trustedAt,
          user: {
            id: publisher.user.id,
            name: publisher.user.name,
            email: publisher.user.email,
            image: publisher.user.image,
            banned: publisher.user.banned,
            shadowBannedAt: publisher.user.shadowBannedAt
              ? new Date(publisher.user.shadowBannedAt).toISOString()
              : null,
          },
        }
      : null,
  };
}

export type AdminProjectFilters = {
  status?: ProjectStatus;
  q?: string;
  island?: (typeof projects.$inferSelect)["island"];
  categoryId?: number;
  publisherId?: number;
  hidden?: boolean;
  deleted?: boolean;
  from?: string;
  to?: string;
};

function adminProjectFilter(filters: AdminProjectFilters) {
  const conditions: (SQL | undefined)[] = [];

  if (filters.status) conditions.push(eq(projects.status, filters.status));

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    conditions.push(
      or(
        ilike(projects.name, pattern),
        ilike(projects.shortDescription, pattern),
        ilike(projects.slug, pattern)
      )
    );
  }

  if (filters.island) conditions.push(eq(projects.island, filters.island));
  if (filters.categoryId) {
    conditions.push(eq(projects.categoryId, filters.categoryId));
  }
  if (filters.publisherId) {
    conditions.push(eq(projects.publisherId, filters.publisherId));
  }

  if (filters.hidden !== undefined) {
    conditions.push(
      filters.hidden
        ? isNotNull(projects.shadowBannedAt)
        : isNull(projects.shadowBannedAt)
    );
  }

  // Deleted rows are excluded unless asked for: the admin list is a working
  // surface, not an archive.
  conditions.push(
    filters.deleted ? isNotNull(projects.deletedAt) : isNull(projects.deletedAt)
  );

  if (filters.from) conditions.push(gte(projects.createdAt, filters.from));
  if (filters.to) conditions.push(lte(projects.createdAt, filters.to));

  return and(...conditions);
}

type ListOptions = AdminProjectFilters & {
  limit: number;
  offset: number;
  /** `queued` puts the longest-waiting item first — the review queue order. */
  sort: "newest" | "queued";
};

async function listProjects(
  db: DB,
  { limit, offset, sort, ...filters }: ListOptions
) {
  const where = adminProjectFilter(filters);

  const [rows, [{ total }]] = await Promise.all([
    queryProjects(db, {
      where,
      orderBy:
        sort === "queued"
          ? [asc(projects.queuedAt), asc(projects.id)]
          : [desc(projects.createdAt)],
      limit,
      offset,
    }),
    db.select({ total: count() }).from(projects).where(where),
  ]);

  return { data: rows.map(serializeAdminProject), total };
}

async function getProject(db: DB, id: number) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, id),
    with: projectWith,
  });

  return project ? serializeAdminProject(project) : null;
}

/**
 * Approving stamps `launched_at` only when it is unset, matching the idempotent
 * behaviour of the maker-facing publish: a project must not jump into a fresh
 * weekly ranking because a review took a few days.
 */
async function approveProject(db: DB, id: number, reviewerId: string) {
  const now = new Date().toISOString();

  const existing = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), isNull(projects.deletedAt)),
    columns: { id: true, status: true, launchedAt: true, publishedAt: true },
  });

  if (!existing || existing.status !== "pending") return null;

  const [updated] = await db
    .update(projects)
    .set({
      status: "published",
      publishedAt: existing.publishedAt ?? now,
      launchedAt: existing.launchedAt ?? now,
      reviewedAt: now,
      reviewedBy: reviewerId,
      rejectionReason: null,
      queuedAt: null,
      updatedAt: now,
    })
    .where(eq(projects.id, id))
    .returning({ id: projects.id, slug: projects.slug, status: projects.status });

  return updated ?? null;
}

async function rejectProject(
  db: DB,
  id: number,
  reviewerId: string,
  reason: string
) {
  const now = new Date().toISOString();

  const [updated] = await db
    .update(projects)
    .set({
      status: "rejected",
      rejectionReason: reason,
      reviewedAt: now,
      reviewedBy: reviewerId,
      queuedAt: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(projects.id, id),
        eq(projects.status, "pending"),
        isNull(projects.deletedAt)
      )
    )
    .returning({ id: projects.id, slug: projects.slug, status: projects.status });

  return updated ?? null;
}

/** Takes a live project back to a draft its maker can fix and resubmit. */
async function unpublishProject(db: DB, id: number, reviewerId: string) {
  const now = new Date().toISOString();

  const [updated] = await db
    .update(projects)
    .set({
      status: "draft",
      reviewedAt: now,
      reviewedBy: reviewerId,
      updatedAt: now,
    })
    .where(
      and(
        eq(projects.id, id),
        eq(projects.status, "published"),
        isNull(projects.deletedAt)
      )
    )
    .returning({ id: projects.id, slug: projects.slug, status: projects.status });

  return updated ?? null;
}

async function restoreProject(db: DB, id: number) {
  const [updated] = await db
    .update(projects)
    .set({ deletedAt: null, updatedAt: new Date().toISOString() })
    .where(and(eq(projects.id, id), isNotNull(projects.deletedAt)))
    .returning({ id: projects.id, slug: projects.slug, status: projects.status });

  return updated ?? null;
}

async function setProjectHidden(
  db: DB,
  id: number,
  actorId: string,
  reason: string | null
) {
  const now = new Date().toISOString();
  const hiding = reason !== null;

  const [updated] = await db
    .update(projects)
    .set({
      shadowBannedAt: hiding ? now : null,
      shadowBannedBy: hiding ? actorId : null,
      shadowBanReason: reason,
      updatedAt: now,
    })
    .where(
      and(
        eq(projects.id, id),
        // Hiding something already hidden, or lifting a hide that isn't there,
        // changes nothing and must not write an audit row.
        hiding
          ? isNull(projects.shadowBannedAt)
          : isNotNull(projects.shadowBannedAt)
      )
    )
    .returning({ id: projects.id, slug: projects.slug });

  return updated ?? null;
}

async function setPublisherTrusted(db: DB, id: number, trusted: boolean) {
  const [updated] = await db
    .update(publishers)
    .set({
      trustedAt: trusted ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(publishers.id, id),
        trusted ? isNull(publishers.trustedAt) : isNotNull(publishers.trustedAt)
      )
    )
    .returning({ id: publishers.id, handle: publishers.handle });

  return updated ?? null;
}

async function countPending(db: DB) {
  const [{ total }] = await db
    .select({ total: count() })
    .from(projects)
    .where(and(eq(projects.status, "pending"), isNull(projects.deletedAt)));

  return total;
}

/** How many live projects a review gate would start queueing if switched on. */
async function countDrafts(db: DB) {
  const [{ total }] = await db
    .select({ total: count() })
    .from(projects)
    .where(and(eq(projects.status, "draft"), isNull(projects.deletedAt)));

  return total;
}

export const AdminProjectsService = {
  listProjects: errorLogger(listProjects, "adminProjectsService.listProjects"),
  getProject: errorLogger(getProject, "adminProjectsService.getProject"),
  approveProject: errorLogger(
    approveProject,
    "adminProjectsService.approveProject"
  ),
  rejectProject: errorLogger(rejectProject, "adminProjectsService.rejectProject"),
  unpublishProject: errorLogger(
    unpublishProject,
    "adminProjectsService.unpublishProject"
  ),
  restoreProject: errorLogger(
    restoreProject,
    "adminProjectsService.restoreProject"
  ),
  setProjectHidden: errorLogger(
    setProjectHidden,
    "adminProjectsService.setProjectHidden"
  ),
  setPublisherTrusted: errorLogger(
    setPublisherTrusted,
    "adminProjectsService.setPublisherTrusted"
  ),
  countPending: errorLogger(countPending, "adminProjectsService.countPending"),
  countDrafts: errorLogger(countDrafts, "adminProjectsService.countDrafts"),
};
