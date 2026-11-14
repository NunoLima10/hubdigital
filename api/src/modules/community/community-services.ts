import type { DB } from "@/db";
import {
  projectAnnouncements,
  announcementVotes,
  projectMembers,
  projectRevisions,
  projects,
  publishers,
  users,
} from "@/db/schemas";
import {
  and,
  desc,
  eq,
  exists,
  gte,
  ilike,
  isNull,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/utils/custom-errors";
import {
  currentWeek,
  toWeekId,
  weekFromId,
  type LaunchRange,
} from "@/utils/week";
import { publicProjectConditions } from "@/utils/project-visibility";
import { toPublicUrl } from "@/utils/public-url";
import { SettingsService } from "@/modules/settings/settings-services";
import { ProjectsService } from "@/modules/projects/projects-services";
import type { Announcement } from "@hubdigital/shared";
import { lockProjectDestinations } from "@/utils/project-duplicates";

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
    week: announcement.publishedAt
      ? toWeekId(new Date(announcement.publishedAt))
      : null,
  };
}
export async function ownerProject(
  db: DB,
  projectId: number,
  publisherId: number,
) {
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
  input: {
    kind: Announcement["kind"];
    introduction: string;
    creationKey: string;
  },
) {
  const project = await ownerProject(db, projectId, publisher.id);
  const owner = await db.query.users.findFirst({
    where: eq(users.id, publisher.userId),
    columns: { shadowBannedAt: true },
  });
  if (
    project.status !== "published" ||
    project.shadowBannedAt ||
    owner?.shadowBannedAt
  )
    throw new BadRequestError(
      "Publica o projeto antes de o apresentar à comunidade.",
    );
  const settings = await SettingsService.getSettings(db);
  if (!settings["submissions.open"])
    throw new BadRequestError("As publicações estão temporariamente fechadas.");
  return db.transaction(async (trx) => {
    const tx = trx as unknown as DB;
    await tx.execute(
      sql`select id from projects where id=${projectId} for update`,
    );
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
      !["available", "public_beta", "invite_only"].includes(
        current.availability ?? "",
      )
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
    if (pending)
      throw new ConflictError("Este projeto já tem um anúncio em revisão.");
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
    if (!created)
      throw new ConflictError(
        "Este projeto já tem um anúncio de primeira versão.",
      );
    if (!review)
      await tx
        .update(projects)
        .set({ launchedAt: now })
        .where(eq(projects.id, projectId));
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
      project: {
        name: projects.name,
        slug: projects.slug,
        logoKey: projects.logoKey,
      },
    })
    .from(projectAnnouncements)
    .innerJoin(projects, eq(projects.id, projectAnnouncements.projectId))
    .where(
      and(
        projectId ? eq(projects.id, projectId) : undefined,
        weekRange ? publishedDuring(weekRange) : undefined,
        ownerId
          ? and(eq(projects.publisherId, ownerId), isNull(projects.deletedAt))
          : and(
              publicProjectConditions,
              eq(projectAnnouncements.status, "published"),
            ),
      ),
    )
    .orderBy(
      desc(voteCount),
      desc(projectAnnouncements.publishedAt),
      desc(projectAnnouncements.id),
    )
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

export async function toggleAnnouncementVote(
  db: DB,
  id: number,
  userId: string,
) {
  return db.transaction(async (trx) => {
    const tx = trx as unknown as DB;
    await tx.execute(
      sql`select id from project_announcements where id=${id} for update`,
    );
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
      .where(
        and(
          eq(announcementVotes.announcementId, id),
          eq(announcementVotes.userId, userId),
        ),
      )
      .returning();
    if (!deleted.length)
      await tx.insert(announcementVotes).values({ announcementId: id, userId });
    return { hasVoted: !deleted.length };
  });
}
const memberPerson = {
  userId: users.id,
  name: users.name,
  handle: publishers.handle,
  image: users.image,
};
const invitationProject = {
  id: projects.id,
  name: projects.name,
  slug: projects.slug,
  logoKey: projects.logoKey,
};
function withLogo<T extends { project: { logoKey: string | null } }>(row: T) {
  const { logoKey, ...project } = row.project;
  return { ...row, project: { ...project, logoUrl: toPublicUrl(logoKey) } };
}

/** The owner sees every invitation; everyone else only accepted members. */
export async function listMembers(
  db: DB,
  projectId: number,
  viewerId?: string,
) {
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
  return db
    .select({
      id: projectMembers.id,
      projectId: projectMembers.projectId,
      status: projectMembers.status,
      ...memberPerson,
      role: projectMembers.role,
    })
    .from(projectMembers)
    .innerJoin(users, eq(users.id, projectMembers.userId))
    .innerJoin(publishers, eq(publishers.userId, users.id))
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        isNull(users.shadowBannedAt),
        project.publisher.userId === viewerId
          ? undefined
          : eq(projectMembers.status, "accepted"),
      ),
    )
    .orderBy(projectMembers.createdAt);
}

/**
 * Invites an existing account by handle. Inviting someone who declined before
 * turns their answer back into a pending invitation.
 */
export async function inviteMember(
  db: DB,
  publisher: typeof publishers.$inferSelect,
  projectId: number,
  handle: string,
  role?: string,
) {
  await ownerProject(db, projectId, publisher.id);
  const target = await db.query.publishers.findFirst({
    where: eq(publishers.handle, handle),
    with: { user: { columns: { banned: true, shadowBannedAt: true } } },
  });
  if (!target || target.user.banned || target.user.shadowBannedAt)
    throw new NotFoundError();
  const [membership] = await db
    .insert(projectMembers)
    .values({
      projectId,
      userId: target.userId,
      invitedBy: publisher.userId,
      status: target.userId === publisher.userId ? "accepted" : "pending",
      role: role ?? null,
    })
    .onConflictDoUpdate({
      target: [projectMembers.projectId, projectMembers.userId],
      set: {
        status: "pending",
        invitedBy: publisher.userId,
        role: role ?? null,
        createdAt: sql`now()`,
      },
      setWhere: eq(projectMembers.status, "declined"),
    })
    .returning();
  return (
    membership ??
    (await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, target.userId),
      ),
    }))
  );
}

/** Pending invitations to published projects, newest first. */
export async function receivedInvitations(db: DB, userId: string) {
  const inviter = alias(users, "inviter");
  const inviterPublisher = alias(publishers, "inviter_publisher");
  const rows = await db
    .select({
      id: projectMembers.id,
      role: projectMembers.role,
      createdAt: projectMembers.createdAt,
      project: invitationProject,
      inviterId: inviter.id,
      inviterName: inviter.name,
      inviterHandle: inviterPublisher.handle,
      inviterImage: inviter.image,
    })
    .from(projectMembers)
    .innerJoin(projects, eq(projects.id, projectMembers.projectId))
    .leftJoin(inviter, eq(inviter.id, projectMembers.invitedBy))
    .leftJoin(inviterPublisher, eq(inviterPublisher.userId, inviter.id))
    .where(
      and(
        eq(projectMembers.userId, userId),
        eq(projectMembers.status, "pending"),
        publicProjectConditions,
      ),
    )
    .orderBy(desc(projectMembers.createdAt));
  return rows.map(
    ({ inviterId, inviterName, inviterHandle, inviterImage, ...row }) =>
      withLogo({
        ...row,
        invitedBy:
          inviterId && inviterName
            ? {
                userId: inviterId,
                name: inviterName,
                handle: inviterHandle,
                image: inviterImage,
              }
            : null,
      }),
  );
}

/** Every invitation for the owner's projects, whatever the answer. */
export async function sentInvitations(
  db: DB,
  publisher: typeof publishers.$inferSelect,
) {
  const rows = await db
    .select({
      id: projectMembers.id,
      role: projectMembers.role,
      status: projectMembers.status,
      createdAt: projectMembers.createdAt,
      project: invitationProject,
      invitee: memberPerson,
    })
    .from(projectMembers)
    .innerJoin(projects, eq(projects.id, projectMembers.projectId))
    .innerJoin(users, eq(users.id, projectMembers.userId))
    .innerJoin(publishers, eq(publishers.userId, users.id))
    .where(
      and(
        eq(projects.publisherId, publisher.id),
        isNull(projects.deletedAt),
        ne(projectMembers.userId, publisher.userId),
        isNull(users.shadowBannedAt),
      ),
    )
    .orderBy(desc(projectMembers.createdAt));
  return rows.map(withLogo);
}

export async function searchMembers(
  db: DB,
  projectId: number,
  publisherId: number,
  query: string,
) {
  const project = await ownerProject(db, projectId, publisherId);
  return searchAccounts(db, project.publisherId, query);
}

/**
 * Accounts the publisher can pick for a team. Works before the project exists:
 * the submit flow selects people first and invites them on submission.
 */
export async function searchAccounts(
  db: DB,
  publisherId: number,
  query: string,
) {
  const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
  return db
    .select(memberPerson)
    .from(publishers)
    .innerJoin(users, eq(users.id, publishers.userId))
    .where(
      and(
        ne(publishers.id, publisherId),
        isNull(users.shadowBannedAt),
        or(eq(users.banned, false), isNull(users.banned)),
        or(ilike(users.name, pattern), ilike(publishers.handle, pattern)),
      ),
    )
    .orderBy(publishers.handle)
    .limit(10);
}

export async function updateMemberRole(
  db: DB,
  projectId: number,
  publisherId: number,
  membershipId: number,
  role: string,
) {
  await ownerProject(db, projectId, publisherId);
  const [changed] = await db
    .update(projectMembers)
    .set({ role })
    .where(
      and(
        eq(projectMembers.id, membershipId),
        eq(projectMembers.projectId, projectId),
      ),
    )
    .returning({ id: projectMembers.id });
  if (!changed) throw new NotFoundError();
  return changed;
}

export async function removeMember(
  db: DB,
  projectId: number,
  publisherId: number,
  membershipId: number,
) {
  await ownerProject(db, projectId, publisherId);
  const [removed] = await db
    .delete(projectMembers)
    .where(
      and(
        eq(projectMembers.id, membershipId),
        eq(projectMembers.projectId, projectId),
      ),
    )
    .returning({ id: projectMembers.id });
  if (!removed) throw new NotFoundError();
  return removed;
}

/** Declining keeps the row so the owner sees the answer. */
export async function replyToInvitation(
  db: DB,
  id: number,
  userId: string,
  accept: boolean,
) {
  const changed = await db
    .update(projectMembers)
    .set({ status: accept ? "accepted" : "declined" })
    .where(
      and(
        eq(projectMembers.id, id),
        eq(projectMembers.userId, userId),
        eq(projectMembers.status, "pending"),
        exists(
          db
            .select({ id: projects.id })
            .from(projects)
            .where(
              and(
                eq(projects.id, projectMembers.projectId),
                publicProjectConditions,
              ),
            ),
        ),
      ),
    )
    .returning({ id: projectMembers.id });
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
    await tx.execute(
      sql`select id from project_announcements where id=${id} for update`,
    );
    const row = await tx.query.projectAnnouncements.findFirst({
      where: and(
        eq(projectAnnouncements.id, id),
        eq(projectAnnouncements.status, "pending"),
      ),
    });
    if (!row) return null;
    const project = await tx.query.projects.findFirst({
      where: and(
        eq(projects.id, row.projectId),
        approve ? publicProjectConditions : undefined,
      ),
    });
    if (!project) throw new ConflictError("O projeto já não está público.");
    if (
      approve &&
      row.kind === "first_release" &&
      !["available", "public_beta", "invite_only"].includes(
        project.availability ?? "",
      )
    )
      throw new ConflictError(
        "O projeto já não está disponível para uma primeira versão.",
      );
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
      await tx
        .update(projects)
        .set({ launchedAt: now })
        .where(eq(projects.id, row.projectId));
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
    await lockProjectDestinations(tx);
    const pointer = await tx.query.projectRevisions.findFirst({
      where: eq(projectRevisions.id, id),
      columns: { projectId: true },
    });
    if (!pointer) return null;
    await tx.execute(
      sql`select id from projects where id=${pointer.projectId} for update`,
    );
    await tx.execute(
      sql`select id from project_revisions where id=${id} for update`,
    );
    const revision = await tx.query.projectRevisions.findFirst({
      where: and(
        eq(projectRevisions.id, id),
        eq(projectRevisions.status, "pending"),
      ),
    });
    if (!revision) return null;
    const project = await tx.query.projects.findFirst({
      where: eq(projects.id, revision.projectId),
      with: { publisher: { columns: { userId: true } } },
    });
    if (
      !project ||
      (approve && (project.deletedAt || project.status !== "published"))
    )
      throw new ConflictError("O projeto já não está público.");
    if (approve) {
      if (project.rowVersion !== revision.baseVersion)
        throw new ConflictError(
          "O projeto mudou. Pede ao autor para reenviar as alterações.",
        );
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
