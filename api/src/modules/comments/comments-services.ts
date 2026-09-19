import { DB } from "@/db";
import { comments, projects, users } from "@/db/schemas";
import { errorLogger } from "@/utils/error-logger";
import { and, asc, eq, isNull } from "drizzle-orm";

type CommentRow = {
  id: number;
  projectId: number;
  parentId: number | null;
  body: string;
  deletedAt: string | null;
  hiddenAt?: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    image: string | null;
    publisher?: { handle: string | null } | null;
  } | null;
};

const DELETED_BODY = "Comentário removido.";

/**
 * A deleted comment keeps its place in the thread — otherwise replies would be
 * orphaned and the conversation would stop making sense — but gives up its text
 * and its author.
 */
function serializeComment(comment: CommentRow, userId?: string) {
  const isDeleted = Boolean(comment.deletedAt);

  return {
    id: comment.id,
    projectId: comment.projectId,
    parentId: comment.parentId,
    body: isDeleted ? DELETED_BODY : comment.body,
    author:
      isDeleted || !comment.user
        ? null
        : {
            id: comment.user.id,
            name: comment.user.name,
            image: comment.user.image,
            handle: comment.user.publisher?.handle ?? null,
          },
    isOwn: !isDeleted && Boolean(userId) && comment.userId === userId,
    isDeleted,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}

async function findPublishedProjectBySlug(db: DB, slug: string) {
  return db.query.projects.findFirst({
    where: and(
      eq(projects.slug, slug),
      eq(projects.status, "published"),
      isNull(projects.deletedAt),
      // A hidden project takes its thread with it: no reading it, and no
      // posting into it either.
      isNull(projects.shadowBannedAt)
    ),
    columns: { id: true },
  });
}

/**
 * Two moderation rules apply here, and they are not the same rule:
 *
 * - A **hidden** comment is gone for every reader. Staff read it through the
 *   admin API, which does not use this function.
 * - A comment by a **hidden user** is gone for everyone except that user, who
 *   goes on seeing their own (specs/ADMIN.md §A4).
 */
function isVisibleToReader(
  row: CommentRow & { user?: { id: string; shadowBannedAt?: Date | null } | null },
  userId?: string
) {
  if (row.hiddenAt) return false;

  const authorHidden = Boolean(row.user?.shadowBannedAt);

  return !authorHidden || row.userId === userId;
}

/**
 * Returns top-level comments, each with its replies. Both levels come back in a
 * single query and are stitched together here rather than in N+1 round trips.
 */
async function listComments(db: DB, projectId: number, userId?: string) {
  const rows = await db.query.comments.findMany({
    where: eq(comments.projectId, projectId),
    with: { user: { with: { publisher: true } } },
    orderBy: asc(comments.createdAt),
  });

  const visible = rows.filter((row) => isVisibleToReader(row, userId));

  const replies = new Map<number, ReturnType<typeof serializeComment>[]>();

  for (const row of visible) {
    if (row.parentId === null) continue;

    const bucket = replies.get(row.parentId) ?? [];
    bucket.push(serializeComment(row, userId));
    replies.set(row.parentId, bucket);
  }

  return visible
    .filter((row) => row.parentId === null)
    // A deleted comment with no replies has nothing left worth showing.
    .filter((row) => !row.deletedAt || replies.has(row.id))
    .map((row) => ({
      ...serializeComment(row, userId),
      replies: replies.get(row.id) ?? [],
    }));
}

type CreateCommentInput = {
  projectId: number;
  userId: string;
  body: string;
  parentId?: number | null;
};

async function createComment(db: DB, input: CreateCommentInput) {
  let parentId: number | null = null;

  if (input.parentId) {
    const parent = await db.query.comments.findFirst({
      where: and(
        eq(comments.id, input.parentId),
        eq(comments.projectId, input.projectId)
      ),
      columns: { id: true, parentId: true, deletedAt: true },
    });

    // Replying to a reply flattens onto its parent, so the thread stays one
    // level deep however the client calls it.
    if (!parent || parent.deletedAt) return null;
    parentId = parent.parentId ?? parent.id;
  }

  const [created] = await db
    .insert(comments)
    .values({
      projectId: input.projectId,
      userId: input.userId,
      body: input.body,
      parentId,
    })
    .returning();

  const user = await db.query.users.findFirst({
    where: eq(users.id, input.userId),
    with: { publisher: true },
  });

  return {
    ...serializeComment({ ...created, user }, input.userId),
    replies: [],
  };
}

async function updateComment(
  db: DB,
  id: number,
  userId: string,
  body: string
) {
  const [updated] = await db
    .update(comments)
    .set({ body, updatedAt: new Date().toISOString() })
    .where(
      and(
        eq(comments.id, id),
        eq(comments.userId, userId),
        isNull(comments.deletedAt)
      )
    )
    .returning();

  if (!updated) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: { publisher: true },
  });

  return { ...serializeComment({ ...updated, user }, userId), replies: [] };
}

/** Admins may remove any comment; everyone else only their own. */
async function deleteComment(
  db: DB,
  id: number,
  userId: string,
  canModerate: boolean
) {
  const ownership = canModerate
    ? undefined
    : eq(comments.userId, userId);

  const [deleted] = await db
    .update(comments)
    .set({ deletedAt: new Date().toISOString() })
    .where(and(eq(comments.id, id), isNull(comments.deletedAt), ownership))
    .returning({ id: comments.id });

  return deleted;
}

export const CommentsService = {
  findPublishedProjectBySlug: errorLogger(
    findPublishedProjectBySlug,
    "commentsService.findPublishedProjectBySlug"
  ),
  listComments: errorLogger(listComments, "commentsService.listComments"),
  createComment: errorLogger(createComment, "commentsService.createComment"),
  updateComment: errorLogger(updateComment, "commentsService.updateComment"),
  deleteComment: errorLogger(deleteComment, "commentsService.deleteComment"),
};
