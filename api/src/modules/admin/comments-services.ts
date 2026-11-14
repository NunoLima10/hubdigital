import { DB } from "@/db";
import { comments } from "@/db/schemas";
import { errorLogger } from "@/utils/error-logger";
import { AdminCommentState } from "@hubdigital/shared";
import {
  SQL,
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
} from "drizzle-orm";

type CommentWithContext = {
  id: number;
  projectId: number;
  parentId: number | null;
  body: string;
  deletedAt: string | null;
  hiddenAt: string | null;
  moderationReason: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { name: string; slug: string } | null;
  user?: {
    id: string;
    name: string;
    image: string | null;
    shadowBannedAt: Date | null;
    publisher?: { handle: string | null } | null;
  } | null;
};

function stateOf(row: CommentWithContext): AdminCommentState {
  if (row.deletedAt) return "deleted";
  if (row.hiddenAt) return "hidden";
  return "visible";
}

/**
 * Unlike the public serializer, this keeps the body and the author of a removed
 * comment: staff are reviewing what was written, and a tombstone would defeat
 * the purpose.
 */
function serializeAdminComment(row: CommentWithContext) {
  return {
    id: row.id,
    projectId: row.projectId,
    projectName: row.project?.name ?? "—",
    projectSlug: row.project?.slug ?? "",
    parentId: row.parentId,
    body: row.body,
    state: stateOf(row),
    moderationReason: row.moderationReason,
    author: row.user
      ? {
          id: row.user.id,
          name: row.user.name,
          image: row.user.image,
          handle: row.user.publisher?.handle ?? null,
        }
      : null,
    authorShadowBanned: Boolean(row.user?.shadowBannedAt),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export type AdminCommentFilters = {
  projectId?: number;
  userId?: string;
  q?: string;
  state?: AdminCommentState;
  from?: string;
  to?: string;
};

function adminCommentFilter(filters: AdminCommentFilters) {
  const conditions: (SQL | undefined)[] = [];

  if (filters.projectId) {
    conditions.push(eq(comments.projectId, filters.projectId));
  }
  if (filters.userId) conditions.push(eq(comments.userId, filters.userId));
  if (filters.q) conditions.push(ilike(comments.body, `%${filters.q}%`));

  if (filters.state === "deleted") {
    conditions.push(isNotNull(comments.deletedAt));
  }
  if (filters.state === "hidden") {
    conditions.push(isNull(comments.deletedAt), isNotNull(comments.hiddenAt));
  }
  if (filters.state === "visible") {
    conditions.push(isNull(comments.deletedAt), isNull(comments.hiddenAt));
  }

  if (filters.from) conditions.push(gte(comments.createdAt, filters.from));
  if (filters.to) conditions.push(lte(comments.createdAt, filters.to));

  return conditions.length ? and(...conditions) : undefined;
}

type ListOptions = AdminCommentFilters & { limit: number; offset: number };

async function listComments(
  db: DB,
  { limit, offset, ...filters }: ListOptions
) {
  const where = adminCommentFilter(filters);

  const [rows, [{ total }]] = await Promise.all([
    db.query.comments.findMany({
      where,
      with: {
        project: { columns: { name: true, slug: true } },
        user: { with: { publisher: { columns: { handle: true } } } },
      },
      orderBy: desc(comments.createdAt),
      limit,
      offset,
    }),
    db.select({ total: count() }).from(comments).where(where),
  ]);

  return { data: rows.map(serializeAdminComment), total };
}

/**
 * Hiding is reversible and keeps the row; `reason: null` lifts it. Nothing is
 * written when the comment is already in the requested state, so a no-op cannot
 * produce an audit row.
 */
async function setCommentHidden(
  db: DB,
  id: number,
  actorId: string,
  reason: string | null
) {
  const now = new Date().toISOString();
  const hiding = reason !== null;

  const [updated] = await db
    .update(comments)
    .set({
      hiddenAt: hiding ? now : null,
      hiddenBy: hiding ? actorId : null,
      moderationReason: reason,
      updatedAt: now,
    })
    .where(
      and(
        eq(comments.id, id),
        isNull(comments.deletedAt),
        hiding ? isNull(comments.hiddenAt) : isNotNull(comments.hiddenAt)
      )
    )
    .returning({ id: comments.id, projectId: comments.projectId });

  return updated ?? null;
}

/** The tombstone path: the body goes, the slot in the thread stays. */
async function deleteComment(
  db: DB,
  id: number,
  actorId: string,
  reason: string
) {
  const now = new Date().toISOString();

  const [deleted] = await db
    .update(comments)
    .set({
      deletedAt: now,
      hiddenBy: actorId,
      moderationReason: reason,
      updatedAt: now,
    })
    .where(and(eq(comments.id, id), isNull(comments.deletedAt)))
    .returning({ id: comments.id, projectId: comments.projectId });

  return deleted ?? null;
}

/** Returns the ids actually changed, so the caller audits one row per change. */
async function bulkModerate(
  db: DB,
  ids: number[],
  actorId: string,
  action: "hide" | "delete",
  reason: string
) {
  const now = new Date().toISOString();

  const set =
    action === "hide"
      ? {
          hiddenAt: now,
          hiddenBy: actorId,
          moderationReason: reason,
          updatedAt: now,
        }
      : {
          deletedAt: now,
          hiddenBy: actorId,
          moderationReason: reason,
          updatedAt: now,
        };

  const updated = await db
    .update(comments)
    .set(set)
    .where(
      and(
        inArray(comments.id, ids),
        isNull(comments.deletedAt),
        action === "hide" ? isNull(comments.hiddenAt) : undefined
      )
    )
    .returning({ id: comments.id });

  return updated.map((row) => row.id);
}

export const AdminCommentsService = {
  listComments: errorLogger(listComments, "adminCommentsService.listComments"),
  setCommentHidden: errorLogger(
    setCommentHidden,
    "adminCommentsService.setCommentHidden"
  ),
  deleteComment: errorLogger(
    deleteComment,
    "adminCommentsService.deleteComment"
  ),
  bulkModerate: errorLogger(bulkModerate, "adminCommentsService.bulkModerate"),
};
