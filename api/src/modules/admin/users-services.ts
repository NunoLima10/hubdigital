import { DB } from "@/db";
import { comments, projectUpvotes, projects, publishers, users } from "@/db/schemas";
import { errorLogger } from "@/utils/error-logger";
import { UserRole } from "@hubdigital/shared";
import {
  SQL,
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
} from "drizzle-orm";

function toIso(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

type UserRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  shadowBannedAt: Date | null;
  shadowBanReason: string | null;
  onboardedAt: Date | null;
  createdAt: Date;
  publisher?: { handle: string | null } | null;
};

function serializeAdminUser(
  row: UserRow,
  counts: { projects: number; comments: number; upvotes: number }
) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image,
    // `role` is free text in the database; anything unrecognised reads as null
    // rather than being asserted into the union.
    role: (row.role === "admin" || row.role === "user"
      ? row.role
      : null) as UserRole | null,
    banned: row.banned,
    banReason: row.banReason,
    banExpires: toIso(row.banExpires),
    shadowBannedAt: toIso(row.shadowBannedAt),
    shadowBanReason: row.shadowBanReason,
    onboardedAt: toIso(row.onboardedAt),
    handle: row.publisher?.handle ?? null,
    projectCount: counts.projects,
    commentCount: counts.comments,
    upvoteCount: counts.upvotes,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

export type AdminUserFilters = {
  q?: string;
  role?: UserRole;
  state?: "all" | "banned" | "hidden" | "staff";
};

function adminUserFilter(filters: AdminUserFilters) {
  const conditions: (SQL | undefined)[] = [];

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    conditions.push(or(ilike(users.name, pattern), ilike(users.email, pattern)));
  }

  if (filters.role) conditions.push(eq(users.role, filters.role));
  if (filters.state === "banned") conditions.push(eq(users.banned, true));
  if (filters.state === "hidden") {
    conditions.push(isNotNull(users.shadowBannedAt));
  }
  if (filters.state === "staff") conditions.push(eq(users.role, "admin"));

  return conditions.length ? and(...conditions) : undefined;
}

/**
 * Counts come from three grouped queries rather than joins: joining projects,
 * comments and upvotes in one statement multiplies the rows and every count
 * comes back wrong.
 */
async function countsFor(db: DB, userIds: string[]) {
  const empty = { projects: 0, comments: 0, upvotes: 0 };
  const result = new Map<string, typeof empty>(
    userIds.map((id) => [id, { ...empty }])
  );

  if (userIds.length === 0) return result;

  const [projectRows, commentRows, upvoteRows] = await Promise.all([
    db
      .select({ userId: publishers.userId, total: count() })
      .from(projects)
      .innerJoin(publishers, eq(publishers.id, projects.publisherId))
      .where(
        and(isNull(projects.deletedAt), inArray(publishers.userId, userIds))
      )
      .groupBy(publishers.userId),
    db
      .select({ userId: comments.userId, total: count() })
      .from(comments)
      .where(
        and(isNull(comments.deletedAt), inArray(comments.userId, userIds))
      )
      .groupBy(comments.userId),
    db
      .select({ userId: projectUpvotes.userId, total: count() })
      .from(projectUpvotes)
      .where(inArray(projectUpvotes.userId, userIds))
      .groupBy(projectUpvotes.userId),
  ]);

  for (const row of projectRows) {
    const entry = result.get(row.userId);
    if (entry) entry.projects = row.total;
  }
  for (const row of commentRows) {
    const entry = result.get(row.userId);
    if (entry) entry.comments = row.total;
  }
  for (const row of upvoteRows) {
    const entry = result.get(row.userId);
    if (entry) entry.upvotes = row.total;
  }

  return result;
}

type ListOptions = AdminUserFilters & { limit: number; offset: number };

async function listUsers(db: DB, { limit, offset, ...filters }: ListOptions) {
  const where = adminUserFilter(filters);

  const [rows, [{ total }]] = await Promise.all([
    db.query.users.findMany({
      where,
      with: { publisher: { columns: { handle: true } } },
      orderBy: desc(users.createdAt),
      limit,
      offset,
    }),
    db.select({ total: count() }).from(users).where(where),
  ]);

  const counts = await countsFor(
    db,
    rows.map((row) => row.id)
  );

  return {
    data: rows.map((row) =>
      serializeAdminUser(row, counts.get(row.id) ?? {
        projects: 0,
        comments: 0,
        upvotes: 0,
      })
    ),
    total,
  };
}

/** The aggregate Better Auth's own admin plugin does not provide. */
async function getUser(db: DB, id: string) {
  const row = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: { publisher: true },
  });

  if (!row) return null;

  const counts = await countsFor(db, [id]);

  const ownProjects = row.publisher
    ? await db.query.projects.findMany({
        where: eq(projects.publisherId, row.publisher.id),
        columns: {
          id: true,
          name: true,
          slug: true,
          status: true,
          shadowBannedAt: true,
          createdAt: true,
        },
        orderBy: desc(projects.createdAt),
      })
    : [];

  return {
    ...serializeAdminUser(row, counts.get(id)!),
    publisher: row.publisher
      ? {
          id: row.publisher.id,
          bio: row.publisher.bio,
          websiteUrl: row.publisher.websiteUrl,
          githubUrl: row.publisher.githubUrl,
          linkedinUrl: row.publisher.linkedinUrl,
          trustedAt: row.publisher.trustedAt,
        }
      : null,
    projects: ownProjects,
  };
}

async function setUserHidden(
  db: DB,
  id: string,
  actorId: string,
  reason: string | null
) {
  const hiding = reason !== null;

  const [updated] = await db
    .update(users)
    .set({
      shadowBannedAt: hiding ? new Date() : null,
      shadowBannedBy: hiding ? actorId : null,
      shadowBanReason: reason,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(users.id, id),
        hiding ? isNull(users.shadowBannedAt) : isNotNull(users.shadowBannedAt)
      )
    )
    .returning({ id: users.id, email: users.email });

  return updated ?? null;
}

export const AdminUsersService = {
  listUsers: errorLogger(listUsers, "adminUsersService.listUsers"),
  getUser: errorLogger(getUser, "adminUsersService.getUser"),
  setUserHidden: errorLogger(setUserHidden, "adminUsersService.setUserHidden"),
};
