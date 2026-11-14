import { DB } from "@/db";
import { moderationActions, users } from "@/db/schemas";
import { errorLogger } from "@/utils/error-logger";
import {
  ModerationAction,
  ModerationTarget,
} from "@hubdigital/shared";
import { SQL, and, count, desc, eq, gte, lte } from "drizzle-orm";

export type AuditEntry = {
  action: ModerationAction;
  targetType: ModerationTarget;
  targetId: string | number;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
};

type Actor = {
  id: string;
  email?: string | null;
};

/**
 * Writes one audit row. Takes a `DB` rather than reading a module-level client
 * so a caller inside `db.transaction()` can pass the transaction handle — the
 * audit row then commits or rolls back with the mutation it describes, which is
 * the whole reason this is not a Fastify hook.
 */
async function record(db: DB, actor: Actor, entry: AuditEntry) {
  await db.insert(moderationActions).values({
    actorId: actor.id,
    actorEmail: actor.email ?? null,
    action: entry.action,
    targetType: entry.targetType,
    targetId: String(entry.targetId),
    reason: entry.reason ?? null,
    metadata: entry.metadata ?? null,
  });
}

/**
 * Runs a mutation and its audit row inside one transaction, so a rolled-back
 * mutation cannot leave behind a log entry claiming it happened — and a logged
 * action cannot be missing its effect.
 *
 * `mutate` returning `null` or `undefined` means it changed nothing (the target
 * was already gone, or in the wrong state). Nothing is written in that case, so
 * a 404 never pollutes the log.
 */
export async function withAudit<T>(
  db: DB,
  actor: Actor,
  mutate: (tx: DB) => Promise<T>,
  entry: (result: NonNullable<T>) => AuditEntry
): Promise<T> {
  return db.transaction(async (trx) => {
    // Drizzle types a transaction handle separately from the database handle
    // even though the query surface used here is identical. Cast once, here,
    // rather than widening every service signature.
    const tx = trx as unknown as DB;

    const result = await mutate(tx);
    if (result === null || result === undefined) return result;

    await record(tx, actor, entry(result as NonNullable<T>));

    return result;
  });
}

export type ListAuditOptions = {
  actorId?: string;
  targetType?: ModerationTarget;
  targetId?: string;
  action?: ModerationAction;
  from?: string;
  to?: string;
  limit: number;
  offset: number;
};

function serializeEntry(row: {
  id: number;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  targetType: ModerationTarget;
  targetId: string;
  reason: string | null;
  metadata: unknown;
  createdAt: string;
  actor?: { id: string; name: string; email: string } | null;
}) {
  return {
    id: row.id,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    reason: row.reason,
    metadata: (row.metadata ?? null) as Record<string, unknown> | null,
    createdAt: row.createdAt,
    // Falls back to the snapshot when the account behind the action is gone.
    actor: row.actor
      ? { id: row.actor.id, name: row.actor.name, email: row.actor.email }
      : { id: null, name: row.actorEmail ?? "Conta removida", email: row.actorEmail },
  };
}

async function listAudit(db: DB, options: ListAuditOptions) {
  const conditions: (SQL | undefined)[] = [];

  if (options.actorId) {
    conditions.push(eq(moderationActions.actorId, options.actorId));
  }
  if (options.targetType) {
    conditions.push(eq(moderationActions.targetType, options.targetType));
  }
  if (options.targetId) {
    conditions.push(eq(moderationActions.targetId, options.targetId));
  }
  if (options.action) {
    conditions.push(eq(moderationActions.action, options.action));
  }
  if (options.from) {
    conditions.push(gte(moderationActions.createdAt, options.from));
  }
  if (options.to) {
    conditions.push(lte(moderationActions.createdAt, options.to));
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.query.moderationActions.findMany({
      where,
      with: { actor: { columns: { id: true, name: true, email: true } } },
      orderBy: desc(moderationActions.createdAt),
      limit: options.limit,
      offset: options.offset,
    }),
    db
      .select({ total: count() })
      .from(moderationActions)
      .where(where ?? undefined),
  ]);

  return { data: rows.map(serializeEntry), total };
}

/** The moderation history shown on a single project or user page. */
async function listForTarget(
  db: DB,
  targetType: ModerationTarget,
  targetId: string | number,
  limit = 50
) {
  const rows = await db.query.moderationActions.findMany({
    where: and(
      eq(moderationActions.targetType, targetType),
      eq(moderationActions.targetId, String(targetId))
    ),
    with: { actor: { columns: { id: true, name: true, email: true } } },
    orderBy: desc(moderationActions.createdAt),
    limit,
  });

  return rows.map(serializeEntry);
}

async function findActor(db: DB, userId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, email: true, name: true },
  });
}

export const AuditService = {
  record: errorLogger(record, "auditService.record"),
  listAudit: errorLogger(listAudit, "auditService.listAudit"),
  listForTarget: errorLogger(listForTarget, "auditService.listForTarget"),
  findActor: errorLogger(findActor, "auditService.findActor"),
};
