import { projects } from "@/db/schemas";
import { and, eq, isNull, sql } from "drizzle-orm";

/**
 * Everything a visitor is allowed to see: published, not deleted, not hidden by
 * staff (specs/ADMIN.md §A4), and not owned by a hidden maker. The single
 * definition every public read goes through, so they cannot drift apart.
 *
 * The subquery uses literal table and column names on purpose: the relational
 * query builder rewrites every interpolated column to the root table it is
 * aliasing, so `${users.id}` inside here would come out as `projects.user_id`.
 * Only the correlating reference to `projects` is interpolated, because that
 * one does belong to the root.
 */
export const publicProjectConditions = and(
  eq(projects.status, "published"),
  isNull(projects.deletedAt),
  isNull(projects.shadowBannedAt),
  sql`not exists (
    select 1
    from publishers p
    inner join users u on u.id = p.user_id
    where p.id = ${projects.publisherId}
      and u.shadow_banned_at is not null
  )`,
);

/** Votes on a project, counted in SQL rather than by loading every row. */
export const upvoteCountSql = sql<number>`(select count(*)::int from project_upvotes pu where pu.project_id = ${projects.id})`;

/**
 * Counts shown on a project card, as relational-query `extras`. Neither a
 * deleted comment nor one hidden by staff belongs in a number on a card.
 */
export function projectEngagementExtras(viewerId?: string) {
  return {
    upvoteCount: upvoteCountSql.as("upvote_count"),
    hasUpvoted: (viewerId
      ? sql<boolean>`exists (select 1 from project_upvotes pu where pu.project_id = ${projects.id} and pu.user_id = ${viewerId})`
      : sql<boolean>`false`
    ).as("has_upvoted"),
    commentCount: sql<number>`(select count(*)::int from comments c where c.project_id = ${projects.id} and c.deleted_at is null and c.hidden_at is null)`.as(
      "comment_count",
    ),
  };
}
