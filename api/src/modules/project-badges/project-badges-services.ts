import { DB } from "@/db";
import { projectBadgeAwards, projects, users, weeklyRankingResults } from "@/db/schemas";
import { errorLogger } from "@/utils/error-logger";
import { logger } from "@/utils/logger";
import { publicProjectConditions } from "@/utils/project-visibility";
import { previousWeek, type WeekRange } from "@/utils/week";
import {
  PIONEER_PROJECT_LIMIT,
  WEEKLY_BADGE_MIN_UPVOTES,
  projectBadgeCatalog,
  upvoteMilestones,
  weeklyBadgeFor,
  type ProjectBadgeKey,
} from "@hubdigital/shared";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";

type AwardRow = typeof projectBadgeAwards.$inferSelect;

const isKnown = (key: string): key is ProjectBadgeKey => key in projectBadgeCatalog;

/** Catalog order, newest period first within one badge. */
function byCatalogOrder(a: AwardRow, b: AwardRow) {
  const order =
    projectBadgeCatalog[a.badgeKey as ProjectBadgeKey].sortOrder -
    projectBadgeCatalog[b.badgeKey as ProjectBadgeKey].sortOrder;
  return order || b.period.localeCompare(a.period);
}

function serialize(row: AwardRow) {
  return {
    id: row.id,
    key: row.badgeKey as ProjectBadgeKey,
    period: row.period || null,
    rank: row.rank,
    // Postgres text isn't parsed by every browser; hand out ISO 8601.
    awardedAt: new Date(row.awardedAt).toISOString(),
  };
}

/** What a project holds, as shown on its public page. */
async function listForProject(db: DB, projectId: number) {
  const rows = await db.query.projectBadgeAwards.findMany({
    where: eq(projectBadgeAwards.projectId, projectId),
  });
  return rows
    .filter((row) => isKnown(row.badgeKey))
    .sort(byCatalogOrder)
    .map(serialize);
}

/** The admin view adds who granted each manual award. */
async function listForAdmin(db: DB, projectId: number) {
  const rows = await db
    .select({ award: projectBadgeAwards, grantorName: users.name })
    .from(projectBadgeAwards)
    .leftJoin(users, eq(users.id, projectBadgeAwards.awardedBy))
    .where(eq(projectBadgeAwards.projectId, projectId));

  return rows
    .filter(({ award }) => isKnown(award.badgeKey))
    .sort((a, b) => byCatalogOrder(a.award, b.award))
    .map(({ award, grantorName }) => ({
      ...serialize(award),
      awardedBy:
        award.awardedBy && grantorName
          ? { id: award.awardedBy, name: grantorName }
          : null,
    }));
}

/**
 * The best place the project ever closed a week at, the first week it got
 * there, and how many weeks it closed there.
 */
async function bestWeeklyRank(db: DB, projectId: number) {
  const [best] = await db
    .select({
      rank: weeklyRankingResults.rank,
      week: sql<string>`min(${weeklyRankingResults.weekId})`,
      times: count(),
    })
    .from(weeklyRankingResults)
    .where(eq(weeklyRankingResults.projectId, projectId))
    .groupBy(weeklyRankingResults.rank)
    .orderBy(asc(weeklyRankingResults.rank))
    .limit(1);

  return best ?? null;
}

/**
 * Awards every upvote milestone the count has reached. Milestones are kept
 * once earned: losing votes later does not take a plaque away.
 */
async function awardUpvoteMilestones(db: DB, projectId: number, upvoteCount: number) {
  const reached = upvoteMilestones.filter((milestone) => upvoteCount >= milestone.threshold);
  if (reached.length === 0) return [];

  const created = await db
    .insert(projectBadgeAwards)
    .values(reached.map(({ key }) => ({ projectId, badgeKey: key })))
    .onConflictDoNothing()
    .returning({ key: projectBadgeAwards.badgeKey });

  return created.map((row) => row.key as ProjectBadgeKey);
}

/** Catches up milestones for every public project, e.g. after a deploy. */
async function awardAllUpvoteMilestones(db: DB) {
  const milestones = sql.join(
    upvoteMilestones.map(({ key, threshold }) => sql`(${key}, ${threshold}::int)`),
    sql`, `,
  );
  await db.execute(sql`
    insert into project_badge_awards (project_id, badge_key)
    select ${projects.id}, m.key
    from ${projects}
    cross join (values ${milestones}) as m(key, threshold)
    where ${publicProjectConditions}
      and (select count(*) from project_upvotes pu where pu.project_id = ${projects.id}) >= m.threshold
    on conflict do nothing
  `);
}

/**
 * Numbers the first projects ever published on the Hub, by first publication.
 * The order includes projects removed since, so a number never shifts.
 */
async function awardPioneers(db: DB) {
  await db.execute(sql`
    insert into project_badge_awards (project_id, badge_key, rank)
    select ordered.id, 'pioneer', ordered.position
    from (
      select id, row_number() over (order by published_at, id)::int as position
      from projects
      where published_at is not null
    ) as ordered
    where ordered.position <= ${PIONEER_PROJECT_LIMIT}
    on conflict do nothing
  `);
}

/**
 * Freezes a week's ranking as it stood at the close and hands out the weekly
 * plaques. Same order as the public ranking (upvotes, then newest), counting
 * only upvotes cast before the week ended. Idempotent: a week that already has
 * results is left alone, and a transaction-scoped advisory lock keeps two API
 * instances from closing it at the same time.
 *
 * Returns the number of ranked projects, or null if the week was closed before.
 */
async function closeWeek(db: DB, week: WeekRange) {
  return db.transaction(async (trx) => {
    // Same query surface; see withAudit for why the handle is cast.
    const tx = trx as unknown as DB;
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('weekly-ranking-close'))`);

    const [{ closed }] = await tx
      .select({ closed: count() })
      .from(weeklyRankingResults)
      .where(eq(weeklyRankingResults.weekId, week.weekId));
    if (closed > 0) return null;

    // Spelled out: a single-table select renders projects.id as a bare "id",
    // which inside these subqueries would bind to the inner table's own id.
    const projectId = sql.raw(`"projects"."id"`);
    const start = week.start.toISOString();
    const end = week.end.toISOString();
    const votes = sql<number>`(
      select count(*)::int from project_upvotes pu
      where pu.project_id = ${projectId}
        and pu.created_at < ${end}::timestamptz
    )`;
    const ranking = await tx
      .select({ id: projects.id, votes })
      .from(projects)
      .where(
        and(
          publicProjectConditions,
          sql`exists (
            select 1 from project_announcements a
            where a.project_id = ${projectId}
              and a.status = 'published'
              and a.published_at >= ${start}::timestamptz
              and a.published_at < ${end}::timestamptz
          )`,
        ),
      )
      .orderBy(desc(votes), desc(projects.createdAt), desc(projects.id));

    if (ranking.length === 0) return 0;

    await tx.insert(weeklyRankingResults).values(
      ranking.map((row, index) => ({
        weekId: week.weekId,
        projectId: row.id,
        rank: index + 1,
        upvotes: row.votes,
      })),
    );

    const plaques = ranking.flatMap((row, index) => {
      const key = weeklyBadgeFor(index + 1);
      if (!key || row.votes < WEEKLY_BADGE_MIN_UPVOTES) return [];
      return [{ projectId: row.id, badgeKey: key, period: week.weekId, rank: index + 1 }];
    });
    if (plaques.length > 0) {
      await tx.insert(projectBadgeAwards).values(plaques).onConflictDoNothing();
    }

    return ranking.length;
  });
}

/**
 * Everything automatic, safe to run any number of times: closes last week if
 * nobody has, then catches up milestones and pioneers.
 */
async function runAutomaticAwards(db: DB, now = new Date()) {
  const week = previousWeek(now);
  const ranked = await closeWeek(db, week);
  if (ranked !== null) logger.info({ week: week.weekId, ranked }, "Weekly ranking closed");
  await awardAllUpvoteMilestones(db);
  await awardPioneers(db);
}

export type GrantProjectBadgeResult =
  | { outcome: "granted"; award: ReturnType<typeof serialize> }
  | { outcome: "already_held" | "not_manual" | "month_taken" };

/** Staff grant. Automatic badges follow their rule and can't be handed out. */
async function grant(
  db: DB,
  projectId: number,
  key: ProjectBadgeKey,
  period: string | undefined,
  actorId: string,
): Promise<GrantProjectBadgeResult> {
  const badge = projectBadgeCatalog[key];
  if (badge.awardMode !== "manual") return { outcome: "not_manual" };
  const awardPeriod = badge.period === "month" ? (period ?? "") : "";

  if (badge.period === "month") {
    // There is one project of the month.
    const holder = await db.query.projectBadgeAwards.findFirst({
      where: and(
        eq(projectBadgeAwards.badgeKey, key),
        eq(projectBadgeAwards.period, awardPeriod),
      ),
      columns: { projectId: true },
    });
    if (holder && holder.projectId !== projectId) return { outcome: "month_taken" };
  }

  const [created] = await db
    .insert(projectBadgeAwards)
    .values({ projectId, badgeKey: key, period: awardPeriod, awardedBy: actorId })
    .onConflictDoNothing()
    .returning();

  return created ? { outcome: "granted", award: serialize(created) } : { outcome: "already_held" };
}

/** Removes a staff-granted award. Automatic awards follow their rule and stay. */
async function revoke(db: DB, projectId: number, awardId: number) {
  const award = await db.query.projectBadgeAwards.findFirst({
    where: and(
      eq(projectBadgeAwards.id, awardId),
      eq(projectBadgeAwards.projectId, projectId),
    ),
  });
  if (!award || !isKnown(award.badgeKey)) return null;
  if (projectBadgeCatalog[award.badgeKey].awardMode !== "manual") return "not_manual" as const;

  await db.delete(projectBadgeAwards).where(eq(projectBadgeAwards.id, awardId));
  return serialize(award);
}

export const ProjectBadgesService = {
  listForProject: errorLogger(listForProject, "projectBadgesService.listForProject"),
  listForAdmin: errorLogger(listForAdmin, "projectBadgesService.listForAdmin"),
  bestWeeklyRank: errorLogger(bestWeeklyRank, "projectBadgesService.bestWeeklyRank"),
  awardUpvoteMilestones: errorLogger(
    awardUpvoteMilestones,
    "projectBadgesService.awardUpvoteMilestones",
  ),
  closeWeek: errorLogger(closeWeek, "projectBadgesService.closeWeek"),
  runAutomaticAwards: errorLogger(runAutomaticAwards, "projectBadgesService.runAutomaticAwards"),
  grant: errorLogger(grant, "projectBadgesService.grant"),
  revoke: errorLogger(revoke, "projectBadgesService.revoke"),
};

const AUTOMATIC_AWARDS_INTERVAL_MS = 15 * 60 * 1000;

/**
 * There is no cron: the API runs the automatic awards once at boot and then
 * every 15 minutes. Every step is idempotent, so a restart or a second
 * instance only repeats no-ops. Returns a stop function for shutdown.
 */
export function startProjectBadgeJobs(db: DB) {
  const run = () =>
    ProjectBadgesService.runAutomaticAwards(db).catch(() => {
      // Already logged by errorLogger; the next tick tries again.
    });
  void run();
  const timer = setInterval(run, AUTOMATIC_AWARDS_INTERVAL_MS);
  timer.unref();
  return () => clearInterval(timer);
}
