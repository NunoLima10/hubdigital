import { DB } from "@/db";
import {
  comments,
  projectEvents,
  projects,
  projectUpvotes,
} from "@/db/schemas";
import { Day, eachDay, shiftDay, startOfLocalDay, toLocalDay } from "@/utils/day";
import { errorLogger } from "@/utils/error-logger";
import { toPublicUrl } from "@/utils/public-url";
import {
  ProjectEventSource,
  ProjectEventType,
  ProjectStats,
  ProjectStatsRow,
  StatsCounters,
  StatsRange,
  statsRangeDays,
} from "@hubdigital/shared";
import { and, count, eq, gte, inArray, isNull, lt, ne, sql } from "drizzle-orm";
import { PgColumn } from "drizzle-orm/pg-core";
import { isbot } from "isbot";

type RecordEventInput = {
  projectId: number;
  type: ProjectEventType;
  source: ProjectEventSource;
  /** The signed-in viewer, if any. */
  viewerUserId?: string;
  userAgent?: string;
};

/**
 * Returns whether the event was counted.
 *
 * Ignored on purpose, and silently: bots, the project's own owner, and anything
 * that is not publicly visible. Drafts and hidden projects would otherwise
 * collect numbers for pages nobody can legitimately reach.
 */
async function recordEvent(db: DB, input: RecordEventInput) {
  // Bot detection is user-agent based, which is only meaningful for browsers.
  // A native app's HTTP library announces itself (okhttp, CFNetwork, …) and
  // would be misread as a crawler.
  if (input.source === "web" && isbot(input.userAgent ?? "")) return false;

  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, input.projectId),
      eq(projects.status, "published"),
      isNull(projects.deletedAt),
      isNull(projects.shadowBannedAt)
    ),
    columns: { id: true },
    with: {
      publisher: {
        columns: { userId: true },
        with: { user: { columns: { shadowBannedAt: true } } },
      },
    },
  });

  if (!project) return false;
  if (project.publisher?.user?.shadowBannedAt) return false;

  // A maker checking their own page is not an audience.
  if (input.viewerUserId && input.viewerUserId === project.publisher?.userId) {
    return false;
  }

  await db
    .insert(projectEvents)
    .values({
      projectId: input.projectId,
      type: input.type,
      source: input.source,
      day: toLocalDay(),
      count: 1,
    })
    .onConflictDoUpdate({
      target: [
        projectEvents.projectId,
        projectEvents.type,
        projectEvents.source,
        projectEvents.day,
      ],
      set: {
        count: sql`${projectEvents.count} + 1`,
        updatedAt: sql`now()`,
      },
    });

  return true;
}

const emptyCounters = (): StatsCounters => ({
  views: 0,
  visits: 0,
  upvotes: 0,
  comments: 0,
});

type Metric = keyof StatsCounters;

type MetricRow = { projectId: number; day: Day; metric: Metric; n: number };

/**
 * Cabo Verde's calendar day of a timestamp column, as text. Done in SQL so the
 * grouping agrees with `project_events.day`, and cast to text so the driver
 * cannot hand back a Date that is quietly shifted into another timezone.
 */
function localDaySql(column: PgColumn) {
  return sql<string>`to_char(${column} at time zone 'Atlantic/Cape_Verde', 'YYYY-MM-DD')`;
}

async function fetchMetricRows(
  db: DB,
  projectIds: number[],
  ownerUserId: string,
  from: Day,
  to: Day
): Promise<MetricRow[]> {
  const fromInstant = startOfLocalDay(from).toISOString();
  const toInstant = startOfLocalDay(shiftDay(to, 1)).toISOString();

  const upvoteDay = localDaySql(projectUpvotes.createdAt);
  const commentDay = localDaySql(comments.createdAt);

  const [events, upvotes, commentRows] = await Promise.all([
    db
      .select({
        projectId: projectEvents.projectId,
        day: projectEvents.day,
        type: projectEvents.type,
        n: sql<number>`coalesce(sum(${projectEvents.count}), 0)::int`,
      })
      .from(projectEvents)
      .where(
        and(
          inArray(projectEvents.projectId, projectIds),
          gte(projectEvents.day, from),
          lt(projectEvents.day, shiftDay(to, 1))
        )
      )
      .groupBy(projectEvents.projectId, projectEvents.day, projectEvents.type),
    db
      .select({
        projectId: projectUpvotes.projectId,
        day: upvoteDay,
        n: count(),
      })
      .from(projectUpvotes)
      .where(
        and(
          inArray(projectUpvotes.projectId, projectIds),
          gte(projectUpvotes.createdAt, fromInstant),
          lt(projectUpvotes.createdAt, toInstant)
        )
      )
      .groupBy(projectUpvotes.projectId, upvoteDay),
    db
      .select({
        projectId: comments.projectId,
        day: commentDay,
        n: count(),
      })
      .from(comments)
      .where(
        and(
          inArray(comments.projectId, projectIds),
          gte(comments.createdAt, fromInstant),
          lt(comments.createdAt, toInstant),
          // Live comments from other people: a deleted or moderated comment is
          // not engagement, and neither is the maker replying to their own thread.
          isNull(comments.deletedAt),
          isNull(comments.hiddenAt),
          ne(comments.userId, ownerUserId)
        )
      )
      .groupBy(comments.projectId, commentDay),
  ]);

  return [
    ...events.map((row) => ({
      projectId: row.projectId,
      day: row.day,
      metric: (row.type === "view" ? "views" : "visits") as Metric,
      n: row.n,
    })),
    ...upvotes.map((row) => ({ ...row, metric: "upvotes" as Metric })),
    ...commentRows.map((row) => ({ ...row, metric: "comments" as Metric })),
  ];
}

/**
 * Stats for a set of projects over the last `range` days, plus the same-length
 * window before it for comparison.
 *
 * The window ends today and includes it, so the last point on the chart is a
 * day still in progress; that is what a maker checking their launch wants.
 */
async function computeStats(
  db: DB,
  projectIds: number[],
  ownerUserId: string,
  range: StatsRange,
  now: Date = new Date()
) {
  const days = statsRangeDays[range];
  const to = toLocalDay(now);
  const from = shiftDay(to, -(days - 1));
  const previousTo = shiftDay(from, -1);
  const previousFrom = shiftDay(previousTo, -(days - 1));

  const totals = emptyCounters();
  const previous = emptyCounters();
  const perProject = new Map<number, StatsCounters>(
    projectIds.map((id) => [id, emptyCounters()])
  );
  const series = new Map(
    eachDay(from, to).map((day) => [
      day,
      { day, views: 0, visits: 0, upvotes: 0 },
    ])
  );

  const rows =
    projectIds.length === 0
      ? []
      : await fetchMetricRows(db, projectIds, ownerUserId, previousFrom, to);

  for (const { projectId, day, metric, n } of rows) {
    if (day >= from) {
      totals[metric] += n;

      const project = perProject.get(projectId);
      if (project) project[metric] += n;

      const point = series.get(day);
      if (point && metric !== "comments") point[metric] += n;
    } else {
      previous[metric] += n;
    }
  }

  const stats: ProjectStats = {
    range,
    from,
    to,
    totals,
    previous,
    series: [...series.values()],
  };

  return { stats, perProject };
}

type Owner = { id: number; userId: string };

async function getProjectStats(
  db: DB,
  owner: Owner,
  projectId: number,
  range: StatsRange
): Promise<ProjectStats | null> {
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.publisherId, owner.id),
      isNull(projects.deletedAt)
    ),
    columns: { id: true },
  });

  // Someone else's project is indistinguishable from one that does not exist.
  if (!project) return null;

  const { stats } = await computeStats(db, [project.id], owner.userId, range);

  return stats;
}

async function getMyProjectStats(db: DB, owner: Owner, range: StatsRange) {
  const owned = await db.query.projects.findMany({
    where: and(eq(projects.publisherId, owner.id), isNull(projects.deletedAt)),
    columns: { id: true, name: true, slug: true, status: true, logoUrl: true },
  });

  const { stats, perProject } = await computeStats(
    db,
    owned.map((project) => project.id),
    owner.userId,
    range
  );

  const rows: ProjectStatsRow[] = owned
    .map((project) => ({
      id: project.id,
      name: project.name,
      slug: project.slug,
      status: project.status,
      logoUrl: toPublicUrl(project.logoUrl),
      ...(perProject.get(project.id) ?? emptyCounters()),
    }))
    // The projects people are actually looking at come first.
    .sort((a, b) => b.views - a.views || b.upvotes - a.upvotes || a.id - b.id);

  return { ...stats, projects: rows };
}

export const ProjectStatsService = {
  recordEvent: errorLogger(recordEvent, "projectStatsService.recordEvent"),
  getProjectStats: errorLogger(
    getProjectStats,
    "projectStatsService.getProjectStats"
  ),
  getMyProjectStats: errorLogger(
    getMyProjectStats,
    "projectStatsService.getMyProjectStats"
  ),
};
