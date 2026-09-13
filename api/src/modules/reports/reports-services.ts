import { DB } from "@/db";
import { comments, projects, reports, users } from "@/db/schemas";
import { PG_ERR_UNIQUE_VIOLATION } from "@/utils/constants";
import { errorLogger } from "@/utils/error-logger";
import {
  ReportReason,
  ReportStatus,
  ReportTarget,
} from "@hubdigital/shared";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { PostgresError } from "postgres";

type CreateReportInput = {
  reporterId: string;
  targetType: ReportTarget;
  targetId: string;
  reason: ReportReason;
  details?: string;
};

/**
 * Reporting the same thing twice is not an error to the person doing it — they
 * think they reported it, and they did. It just doesn't count twice.
 */
async function createReport(db: DB, input: CreateReportInput) {
  try {
    const [created] = await db
      .insert(reports)
      .values({
        reporterId: input.reporterId,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        details: input.details ?? null,
      })
      .returning({ id: reports.id });

    return { id: created.id, duplicate: false };
  } catch (error) {
    if (
      error instanceof PostgresError &&
      error.code === PG_ERR_UNIQUE_VIOLATION
    ) {
      return { id: null, duplicate: true };
    }

    throw error;
  }
}

/** Verifies the thing being reported exists, so the inbox has no dead rows. */
async function targetExists(db: DB, targetType: ReportTarget, targetId: string) {
  if (targetType === "project") {
    const id = Number(targetId);
    if (!Number.isInteger(id)) return false;

    const row = await db.query.projects.findFirst({
      where: eq(projects.id, id),
      columns: { id: true },
    });
    return Boolean(row);
  }

  if (targetType === "comment") {
    const id = Number(targetId);
    if (!Number.isInteger(id)) return false;

    const row = await db.query.comments.findFirst({
      where: eq(comments.id, id),
      columns: { id: true },
    });
    return Boolean(row);
  }

  const row = await db.query.users.findFirst({
    where: eq(users.id, targetId),
    columns: { id: true },
  });
  return Boolean(row);
}

type ReportRow = typeof reports.$inferSelect;

/**
 * Groups by target: five people reporting one comment is one thing to look at,
 * not five. `openCount` drives the ordering, so a target with nothing open
 * falls to the bottom without disappearing.
 */
function groupReports(
  rows: ReportRow[],
  labels: Map<string, { label: string; href: string }>
) {
  const groups = new Map<
    string,
    {
      targetType: ReportTarget;
      targetId: string;
      reportCount: number;
      openCount: number;
      status: ReportStatus;
      reasons: ReportReason[];
      latestAt: string;
      latestDetails: string | null;
      targetLabel: string | null;
      targetHref: string | null;
      reportIds: number[];
    }
  >();

  for (const row of rows) {
    const key = `${row.targetType}:${row.targetId}`;
    const meta = labels.get(key);

    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        targetType: row.targetType,
        targetId: row.targetId,
        reportCount: 1,
        openCount: row.status === "open" ? 1 : 0,
        status: row.status,
        reasons: [row.reason],
        latestAt: row.createdAt,
        latestDetails: row.details,
        targetLabel: meta?.label ?? null,
        targetHref: meta?.href ?? null,
        reportIds: [row.id],
      });
      continue;
    }

    existing.reportCount += 1;
    if (row.status === "open") existing.openCount += 1;
    if (!existing.reasons.includes(row.reason)) {
      existing.reasons.push(row.reason);
    }
    existing.reportIds.push(row.id);

    if (row.createdAt > existing.latestAt) {
      existing.latestAt = row.createdAt;
      existing.latestDetails = row.details;
      existing.status = row.status;
    }
  }

  return [...groups.values()].sort(
    (a, b) =>
      b.openCount - a.openCount ||
      b.reportCount - a.reportCount ||
      (a.latestAt < b.latestAt ? 1 : -1)
  );
}

/** One round trip per target type to label the groups for the inbox. */
async function labelTargets(db: DB, rows: ReportRow[]) {
  const labels = new Map<string, { label: string; href: string }>();

  const projectIds = rows
    .filter((row) => row.targetType === "project")
    .map((row) => Number(row.targetId))
    .filter(Number.isInteger);

  const commentIds = rows
    .filter((row) => row.targetType === "comment")
    .map((row) => Number(row.targetId))
    .filter(Number.isInteger);

  const userIds = rows
    .filter((row) => row.targetType === "user")
    .map((row) => row.targetId);

  const [projectRows, commentRows, userRows] = await Promise.all([
    projectIds.length
      ? db.query.projects.findMany({
          where: inArray(projects.id, projectIds),
          columns: { id: true, name: true },
        })
      : Promise.resolve([]),
    commentIds.length
      ? db.query.comments.findMany({
          where: inArray(comments.id, commentIds),
          columns: { id: true, body: true, projectId: true },
        })
      : Promise.resolve([]),
    userIds.length
      ? db.query.users.findMany({
          where: inArray(users.id, userIds),
          columns: { id: true, name: true, email: true },
        })
      : Promise.resolve([]),
  ]);

  for (const row of projectRows) {
    labels.set(`project:${row.id}`, {
      label: row.name,
      href: `/projects/${row.id}`,
    });
  }
  for (const row of commentRows) {
    labels.set(`comment:${row.id}`, {
      label: row.body.slice(0, 120),
      href: `/comments?projectId=${row.projectId}`,
    });
  }
  for (const row of userRows) {
    labels.set(`user:${row.id}`, {
      label: `${row.name} · ${row.email}`,
      href: `/users/${row.id}`,
    });
  }

  return labels;
}

async function listReportGroups(db: DB, status?: ReportStatus) {
  const rows = await db.query.reports.findMany({
    where: status ? eq(reports.status, status) : undefined,
    orderBy: desc(reports.createdAt),
    limit: 500,
  });

  const labels = await labelTargets(db, rows);

  return groupReports(rows, labels);
}

/**
 * Resolving is per target, not per report: once staff have looked at the thing,
 * every open report about it has been answered.
 */
async function resolveTarget(
  db: DB,
  targetType: ReportTarget,
  targetId: string,
  resolverId: string,
  outcome: "resolved" | "dismissed",
  note?: string
) {
  const resolved = await db
    .update(reports)
    .set({
      status: outcome,
      resolvedBy: resolverId,
      resolvedAt: new Date().toISOString(),
      resolutionNote: note ?? null,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(reports.targetType, targetType),
        eq(reports.targetId, targetId),
        inArray(reports.status, ["open", "reviewing"])
      )
    )
    .returning({ id: reports.id });

  return resolved.length ? resolved.map((row) => row.id) : null;
}

async function countOpen(db: DB) {
  const [{ total }] = await db
    .select({ total: count() })
    .from(reports)
    .where(eq(reports.status, "open"));

  return total;
}

export const ReportsService = {
  createReport: errorLogger(createReport, "reportsService.createReport"),
  targetExists: errorLogger(targetExists, "reportsService.targetExists"),
  listReportGroups: errorLogger(
    listReportGroups,
    "reportsService.listReportGroups"
  ),
  resolveTarget: errorLogger(resolveTarget, "reportsService.resolveTarget"),
  countOpen: errorLogger(countOpen, "reportsService.countOpen"),
};
