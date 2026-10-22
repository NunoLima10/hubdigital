import type { DB } from "@/db";
import { projectLinks, projectLinkClicks, projects } from "@/db/schemas";
import { and, eq, gte, lt, isNull, sql } from "drizzle-orm";
import { isbot } from "isbot";
import {
  projectLinkReferralHref,
  statsRangeDays,
  type LinkClickSurface,
  type ProjectLinkKind,
  type StatsRange,
} from "@hubdigital/shared";
import { shiftDay, toLocalDay } from "@/utils/day";
import { ProjectStatsService } from "./project-stats-services";
export async function findPublicDestination(db: DB, linkId: number) {
  const link = await db.query.projectLinks.findFirst({ where: eq(projectLinks.id, linkId) });
  if (!link) return null;
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, link.projectId),
      eq(projects.status, "published"),
      isNull(projects.deletedAt),
      isNull(projects.shadowBannedAt),
    ),
    columns: { id: true },
    with: {
      publisher: {
        columns: { userId: true },
        with: { user: { columns: { shadowBannedAt: true } } },
      },
    },
  });
  if (!project || project.publisher?.user.shadowBannedAt) return null;
  const href = projectLinkReferralHref({ ...link, label: link.label ?? undefined });
  return href ? { link, href, ownerUserId: project.publisher.userId } : null;
}
export async function recordDestinationClick(
  db: DB,
  destination: NonNullable<Awaited<ReturnType<typeof findPublicDestination>>>,
  input: {
    surface: LinkClickSurface;
    viewerUserId?: string;
    userAgent?: string;
    prefetch: boolean;
  },
) {
  if (
    input.prefetch ||
    isbot(input.userAgent ?? "") ||
    input.viewerUserId === destination.ownerUserId
  )
    return;
  const day = toLocalDay();
  await db.transaction(async (tx) => {
    await tx
      .insert(projectLinkClicks)
      .values({ linkId: destination.link.id, day, surface: input.surface, count: 1 })
      .onConflictDoUpdate({
        target: [projectLinkClicks.linkId, projectLinkClicks.day, projectLinkClicks.surface],
        set: { count: sql`${projectLinkClicks.count}+1` },
      });
    await ProjectStatsService.recordEvent(tx, {
      projectId: destination.link.projectId,
      type: "visit",
      source: "web",
      viewerUserId: input.viewerUserId,
      userAgent: input.userAgent,
    });
  });
}
export async function getDestinationStats(
  db: DB,
  publisherId: number,
  projectId: number,
  range: StatsRange,
) {
  const owner = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.publisherId, publisherId),
      isNull(projects.deletedAt),
    ),
    columns: { id: true },
  });
  if (!owner) return null;
  const from = shiftDay(toLocalDay(), 1 - statsRangeDays[range]);
  const rows = await db
    .select({
      linkId: projectLinks.id,
      label: projectLinks.label,
      kind: projectLinks.kind,
      surface: projectLinkClicks.surface,
      clicks: sql<number>`coalesce(sum(${projectLinkClicks.count}),0)::int`,
    })
    .from(projectLinks)
    .leftJoin(
      projectLinkClicks,
      and(
        eq(projectLinkClicks.linkId, projectLinks.id),
        gte(projectLinkClicks.day, from),
        lt(projectLinkClicks.day, shiftDay(toLocalDay(), 1)),
      ),
    )
    .where(eq(projectLinks.projectId, projectId))
    .groupBy(projectLinks.id, projectLinkClicks.surface);
  const result = new Map<
    number,
    {
      linkId: number;
      label: string | null;
      kind: ProjectLinkKind;
      clicks: number;
      detail: number;
      card: number;
      map: number;
    }
  >();
  for (const row of rows) {
    const item = result.get(row.linkId) ?? {
      linkId: row.linkId,
      label: row.label,
      kind: row.kind,
      clicks: 0,
      detail: 0,
      card: 0,
      map: 0,
    };
    item.clicks += row.clicks;
    if (row.surface) item[row.surface] += row.clicks;
    result.set(row.linkId, item);
  }
  return { range, links: [...result.values()] };
}
