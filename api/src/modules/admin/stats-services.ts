import { DB } from "@/db";
import {
  comments,
  projectUpvotes,
  projects,
  publishers,
  reports,
  users,
} from "@/db/schemas";
import { errorLogger } from "@/utils/error-logger";
import { SQL, and, asc, count, eq, gte, isNotNull, isNull, lt } from "drizzle-orm";
import { PgColumn, PgTable } from "drizzle-orm/pg-core";

const DAY_MS = 24 * 60 * 60 * 1000;

async function countRows(db: DB, table: PgTable, where?: SQL) {
  const [{ total }] = await db.select({ total: count() }).from(table).where(where);
  return total;
}

/**
 * Both windows are computed against the same `now`, so the comparison is
 * "last 7 days vs. the 7 before that" rather than two independent clocks.
 */
function windows(now: Date) {
  const last = new Date(now.getTime() - 7 * DAY_MS);
  const previous = new Date(now.getTime() - 14 * DAY_MS);

  return { last, previous };
}

async function activity(db: DB, from: Date, to?: Date) {
  // The schema mixes timestamp modes — `users` came from the Better Auth
  // generator and reads as Date, everything else uses the repo's string-mode
  // `timestamps` helper — so the bound has to be built per column type rather
  // than shared.
  const dates = (column: PgColumn) =>
    to ? and(gte(column, from), lt(column, to)) : gte(column, from);

  const iso = (column: PgColumn) =>
    to
      ? and(gte(column, from.toISOString()), lt(column, to.toISOString()))
      : gte(column, from.toISOString());

  const [signups, submissions, publishes, commentCount, upvotes] =
    await Promise.all([
      countRows(db, users, dates(users.createdAt)),
      countRows(db, projects, iso(projects.createdAt)),
      countRows(db, projects, iso(projects.publishedAt)),
      countRows(
        db,
        comments,
        and(iso(comments.createdAt), isNull(comments.deletedAt))
      ),
      countRows(db, projectUpvotes, iso(projectUpvotes.createdAt)),
    ]);

  return {
    signups,
    submissions,
    publishes,
    comments: commentCount,
    upvotes,
  };
}

async function getStats(db: DB) {
  const now = new Date();
  const { last, previous } = windows(now);

  const [
    pending,
    oldest,
    openReports,
    hiddenProjects,
    hiddenUsers,
    last7,
    previous7,
    totalUsers,
    totalPublishers,
    totalProjects,
    totalPublished,
  ] = await Promise.all([
    countRows(
      db,
      projects,
      and(eq(projects.status, "pending"), isNull(projects.deletedAt))
    ),
    db.query.projects.findFirst({
      where: and(eq(projects.status, "pending"), isNull(projects.deletedAt)),
      columns: { queuedAt: true },
      orderBy: asc(projects.queuedAt),
    }),
    countRows(db, reports, eq(reports.status, "open")),
    countRows(
      db,
      projects,
      and(isNotNull(projects.shadowBannedAt), isNull(projects.deletedAt))
    ),
    countRows(db, users, isNotNull(users.shadowBannedAt)),
    activity(db, last),
    activity(db, previous, last),
    countRows(db, users),
    countRows(db, publishers),
    countRows(db, projects, isNull(projects.deletedAt)),
    countRows(
      db,
      projects,
      and(eq(projects.status, "published"), isNull(projects.deletedAt))
    ),
  ]);

  return {
    queue: { pending, oldestQueuedAt: oldest?.queuedAt ?? null },
    openReports,
    hiddenProjects,
    hiddenUsers,
    last7,
    previous7,
    totals: {
      users: totalUsers,
      publishers: totalPublishers,
      projects: totalProjects,
      published: totalPublished,
    },
  };
}

export const AdminStatsService = {
  getStats: errorLogger(getStats, "adminStatsService.getStats"),
};
