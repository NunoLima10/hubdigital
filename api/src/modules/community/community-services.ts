import type { DB } from "@/db";
import {
  projectAnnouncements,
  announcementVotes,
  projectMakers,
  projectRevisions,
  projects,
  publishers,
  users,
} from "@/db/schemas";
import { and, desc, eq, exists, gte, isNull, lt, sql } from "drizzle-orm";
import { BadRequestError, ConflictError, NotFoundError } from "@/utils/custom-errors";
import { currentWeek, toWeekId, weekFromId, type LaunchRange } from "@/utils/week";
import { publicProjectConditions } from "@/utils/project-visibility";
import { toPublicUrl } from "@/utils/public-url";
import { SettingsService } from "@/modules/settings/settings-services";
import { ProjectsService } from "@/modules/projects/projects-services";
import type { Announcement } from "@hubdigital/shared";

/** Published inside a weekly window; the week is derived from `published_at`. */
function publishedDuring(week: Pick<LaunchRange, "start" | "end">) {
  return and(
    eq(projectAnnouncements.status, "published"),
    gte(projectAnnouncements.publishedAt, week.start.toISOString()),
    lt(projectAnnouncements.publishedAt, week.end.toISOString()),
  );
}

/** The API still reports the week an announcement ranks in. */
function withWeek<T extends { publishedAt: string | null }>(announcement: T) {
  return {
    ...announcement,
    week: announcement.publishedAt ? toWeekId(new Date(announcement.publishedAt)) : null,
  };
}
export async function ownerProject(db: DB, projectId: number, publisherId: number) {
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.publisherId, publisherId),
      isNull(projects.deletedAt),
    ),
  });
  if (!project) throw new NotFoundError();
  return project;
}
export async function createAnnouncement(
  db: DB,
  publisher: typeof publishers.$inferSelect,
  projectId: number,
  input: { kind: Announcement["kind"]; introduction: string; creationKey: string },
) {
  const project = await ownerProject(db, projectId, publisher.id);
  const owner = await db.query.users.findFirst({
    where: eq(users.id, publisher.userId),
    columns: { shadowBannedAt: true },
  });
  if (project.status !== "published" || project.shadowBannedAt || owner?.shadowBannedAt)
    throw new BadRequestError("Publica o projeto antes de o apresentar à comunidade.");
  const settings = await SettingsService.getSettings(db);
  if (!settings["submissions.open"])
    throw new BadRequestError("As publicações estão temporariamente fechadas.");
  return db.transaction(async (trx) => {
    const tx = trx as unknown as DB;
    await tx.execute(sql`select id from projects where id=${projectId} for update`);
    const current = await tx.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.publisherId, publisher.id),
        publicProjectConditions,
      ),
    });
    if (!current) throw new ConflictError("O projeto já não está público.");
    const existing = await tx.query.projectAnnouncements.findFirst({
      where: and(
        eq(projectAnnouncements.projectId, projectId),
        eq(projectAnnouncements.creationKey, input.creationKey),
      ),
    });
    if (existing) return withWeek(existing);
    if (
      input.kind === "first_release" &&
      !["available", "public_beta", "invite_only"].includes(current.availability ?? "")
    )
      throw new BadRequestError(
        "A primeira versão precisa de estar disponível para experimentar. Para uma lista de espera, escolhe Apresentação.",
      );
    const pending = await tx.query.projectAnnouncements.findFirst({
      where: and(
        eq(projectAnnouncements.projectId, projectId),
        eq(projectAnnouncements.status, "pending"),
      ),
    });
    if (pending) throw new ConflictError("Este projeto já tem um anúncio em revisão.");
    const review =
      settings["moderation.review_required"] &&
      !(settings["moderation.auto_approve_trusted"] && publisher.trustedAt);
    if (
      !review &&
      (await tx.query.projectAnnouncements.findFirst({
        where: and(
          eq(projectAnnouncements.projectId, projectId),
          publishedDuring(currentWeek()),
        ),
      }))
    )
      throw new ConflictError("Este projeto já foi apresentado esta semana.");
    const now = new Date().toISOString();
    const [created] = await tx
      .insert(projectAnnouncements)
      .values({
        ...input,
        projectId,
        status: review ? "pending" : "published",
        publishedAt: review ? null : now,
      })
      .onConflictDoNothing()
      .returning();
    if (!created) throw new ConflictError("Este projeto já tem um anúncio de primeira versão.");
    if (!review)
      await tx.update(projects).set({ launchedAt: now }).where(eq(projects.id, projectId));
    return withWeek(created);
  });
}
export async function listAnnouncements(
  db: DB,
  {
    projectId,
    week,
    userId,
    ownerId,
    limit = 50,
    offset = 0,
  }: {
    projectId?: number;
    week?: string;
    userId?: string;
    ownerId?: number;
    limit?: number;
    offset?: number;
  },
) {
  const weekRange = week ? weekFromId(week) : null;
  if (week && !weekRange) return [];
  const voteCount = sql<number>`(select count(*)::int from announcement_votes av where av.announcement_id=${projectAnnouncements.id})`;
  const hasVoted = sql<boolean>`exists(select 1 from announcement_votes av where av.announcement_id=${projectAnnouncements.id} and av.user_id=${userId ?? ""})`;
  const rows = await db
    .select({
      announcement: projectAnnouncements,
      votes: voteCount,
      hasVoted,
      project: { name: projects.name, slug: projects.slug, logoKey: projects.logoKey },
    })
    .from(projectAnnouncements)
    .innerJoin(projects, eq(projects.id, projectAnnouncements.projectId))
    .where(
      and(
        projectId ? eq(projects.id, projectId) : undefined,
        weekRange ? publishedDuring(weekRange) : undefined,
        ownerId
          ? and(eq(projects.publisherId, ownerId), isNull(projects.deletedAt))
          : and(publicProjectConditions, eq(projectAnnouncements.status, "published")),
      ),
    )
    .orderBy(desc(voteCount), desc(projectAnnouncements.publishedAt), desc(projectAnnouncements.id))
    .limit(limit)
    .offset(offset);
  return rows.map(({ announcement, project, votes, hasVoted }) => {
    const { rejectionReason, ...data } = announcement;
    const { logoKey, ...projectFields } = project;
    return {
      ...withWeek(data),
      ...(ownerId ? { rejectionReason } : {}),
      votes,
      hasVoted,
      project: { ...projectFields, logoUrl: toPublicUrl(logoKey) },
    };
  });
}

export async function toggleAnnouncementVote(db: DB, id: number, userId: string) {
  return db.transaction(async (trx) => {
    const tx = trx as unknown as DB;
    await tx.execute(sql`select id from project_announcements where id=${id} for update`);
    const [announcement] = await tx
      .select({ id: projectAnnouncements.id })
      .from(projectAnnouncements)
      .innerJoin(projects, eq(projects.id, projectAnnouncements.projectId))
      .where(
        and(
          eq(projectAnnouncements.id, id),
          eq(projectAnnouncements.status, "published"),
          publicProjectConditions,
        ),
      );
    if (!announcement) throw new NotFoundError();
    const deleted = await tx
      .delete(announcementVotes)
      .where(and(eq(announcementVotes.announcementId, id), eq(announcementVotes.userId, userId)))
      .returning();
    if (!deleted.length) await tx.insert(announcementVotes).values({ announcementId: id, userId });
    return { hasVoted: !deleted.length };
  });
}
export async function listMakers(db: DB, projectId: number, viewerId?: string) {
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), isNull(projects.deletedAt)),
    with: {
      publisher: {
        columns: { userId: true },
        with: { user: { columns: { shadowBannedAt: true } } },
      },
    },
  });
  if (
    !project ||
    project.publisher.user.shadowBannedAt ||
    project.shadowBannedAt ||
    (project.status !== "published" && project.publisher.userId !== viewerId)
  )
    throw new NotFoundError();
  const rows = await db
    .select({
      id: projectMakers.id,
      projectId: projectMakers.projectId,
      status: projectMakers.status,
      userId: users.id,
      name: users.name,
      handle: publishers.handle,
      image: users.image,
    })
    .from(projectMakers)
    .innerJoin(users, eq(users.id, projectMakers.userId))
    .innerJoin(publishers, eq(publishers.userId, users.id))
    .where(
      and(
        eq(projectMakers.projectId, projectId),
        isNull(users.shadowBannedAt),
        project.publisher.userId === viewerId ? undefined : eq(projectMakers.status, "accepted"),
      ),
    );
  return rows;
}
export async function inviteMaker(
  db: DB,
  publisher: typeof publishers.$inferSelect,
  projectId: number,
  handle: string,
) {
  await ownerProject(db, projectId, publisher.id);
  const target = await db.query.publishers.findFirst({
    where: eq(publishers.handle, handle),
    with: { user: { columns: { banned: true, shadowBannedAt: true } } },
  });
  if (!target || target.user.banned || target.user.shadowBannedAt) throw new NotFoundError();
  const [membership] = await db
    .insert(projectMakers)
    .values({
      projectId,
      userId: target.userId,
      invitedBy: publisher.userId,
      status: target.userId === publisher.userId ? "accepted" : "pending",
    })
    .onConflictDoNothing()
    .returning();
  return (
    membership ??
    (await db.query.projectMakers.findFirst({
      where: and(eq(projectMakers.projectId, projectId), eq(projectMakers.userId, target.userId)),
    }))
  );
}
export async function makerInvitations(db: DB, userId: string) {
  return db
    .select({ id: projectMakers.id, projectId: projects.id, name: projects.name })
    .from(projectMakers)
    .innerJoin(projects, eq(projects.id, projectMakers.projectId))
    .where(
      and(
        eq(projectMakers.userId, userId),
        eq(projectMakers.status, "pending"),
        publicProjectConditions,
      ),
    );
}
export async function replyToMakerInvitation(db: DB, id: number, userId: string, accept: boolean) {
  const where = and(
    eq(projectMakers.id, id),
    eq(projectMakers.userId, userId),
    eq(projectMakers.status, "pending"),
    accept
      ? exists(
          db
            .select({ id: projects.id })
            .from(projects)
            .where(and(eq(projects.id, projectMakers.projectId), publicProjectConditions)),
        )
      : undefined,
  );
  const changed = accept
    ? await db
        .update(projectMakers)
        .set({ status: "accepted" })
        .where(where)
        .returning({ id: projectMakers.id })
    : await db.delete(projectMakers).where(where).returning({ id: projectMakers.id });
  if (!changed.length) throw new NotFoundError();
  return { accepted: accept };
}
export async function reviewAnnouncement(
  db: DB,
  id: number,
  actorId: string,
  approve: boolean,
  reason?: string,
) {
  return db.transaction(async (trx) => {
    const tx = trx as unknown as DB;
    await tx.execute(sql`select id from project_announcements where id=${id} for update`);
    const row = await tx.query.projectAnnouncements.findFirst({
      where: and(eq(projectAnnouncements.id, id), eq(projectAnnouncements.status, "pending")),
    });
    if (!row) return null;
    const project = await tx.query.projects.findFirst({
      where: and(eq(projects.id, row.projectId), approve ? publicProjectConditions : undefined),
    });
    if (!project) throw new ConflictError("O projeto já não está público.");
    if (
      approve &&
      row.kind === "first_release" &&
      !["available", "public_beta", "invite_only"].includes(project.availability ?? "")
    )
      throw new ConflictError("O projeto já não está disponível para uma primeira versão.");
    const now = new Date().toISOString();
    if (
      approve &&
      (await tx.query.projectAnnouncements.findFirst({
        where: and(
          eq(projectAnnouncements.projectId, row.projectId),
          publishedDuring(currentWeek()),
        ),
      }))
    )
      throw new ConflictError("Este projeto já foi apresentado esta semana.");
    await tx
      .update(projectAnnouncements)
      .set({
        status: approve ? "published" : "rejected",
        rejectionReason: approve ? null : reason,
        publishedAt: approve ? now : null,
        reviewedBy: actorId,
      })
      .where(eq(projectAnnouncements.id, id));
    if (approve)
      await tx.update(projects).set({ launchedAt: now }).where(eq(projects.id, row.projectId));
    return { projectId: row.projectId };
  });
}
export async function reviewRevision(
  db: DB,
  id: number,
  actorId: string,
  approve: boolean,
  reason?: string,
) {
  return db.transaction(async (trx) => {
    const tx = trx as unknown as DB;
    const pointer = await tx.query.projectRevisions.findFirst({
      where: eq(projectRevisions.id, id),
      columns: { projectId: true },
    });
    if (!pointer) return null;
    await tx.execute(sql`select id from projects where id=${pointer.projectId} for update`);
    await tx.execute(sql`select id from project_revisions where id=${id} for update`);
    const revision = await tx.query.projectRevisions.findFirst({
      where: and(eq(projectRevisions.id, id), eq(projectRevisions.status, "pending")),
    });
    if (!revision) return null;
    const project = await tx.query.projects.findFirst({
      where: eq(projects.id, revision.projectId),
      with: { publisher: { columns: { userId: true } } },
    });
    if (!project || (approve && (project.deletedAt || project.status !== "published")))
      throw new ConflictError("O projeto já não está público.");
    if (approve) {
      if (project.rowVersion !== revision.baseVersion)
        throw new ConflictError("O projeto mudou. Pede ao autor para reenviar as alterações.");
      await ProjectsService.updateProject(
        tx,
        project.id,
        project.publisherId,
        { ...revision.body, userId: project.publisher.userId },
        { bypassReview: true },
      );
    }
    await tx
      .update(projectRevisions)
      .set({
        status: approve ? "approved" : "rejected",
        reason: approve ? null : reason,
        reviewedBy: actorId,
      })
      .where(eq(projectRevisions.id, id));
    return { projectId: revision.projectId };
  });
}
