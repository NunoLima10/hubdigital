import "../setup-env";
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { setupDB, teardownDB } from "@/db";
import {
  projects,
  publishers,
  projectRevisions,
  projectAnnouncements,
  moderationActions,
  users,
} from "@/db/schemas";
import { invalidateSettingsCache } from "@/modules/settings/settings-services";
import { buildServer } from "@/server";
import { currentWeek } from "@/utils/week";
import { eq, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import {
  insertUser,
  insertPublisher,
  insertCategory,
  insertProject,
  resetDb,
  migrationsFolder,
} from "./helpers/admin-harness";
const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }));
vi.mock("../../src/lib/auth", () => ({
  auth: { api: { getSession: getSessionMock, updateUser: vi.fn() }, handler: vi.fn() },
}));
describe("community announcements, makers and reviewed edits", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>,
    db: Awaited<ReturnType<typeof setupDB>>["db"],
    client: Awaited<ReturnType<typeof setupDB>>["dbClient"],
    server: FastifyInstance;
  let ownerId: string,
    otherId: string,
    adminId: string,
    publisherId: number,
    projectId: number,
    slug: string;
  const sign = (id: string | null, role = "user") =>
    getSessionMock.mockResolvedValue(id ? { user: { id, role } } : null);
  const create = (kind = "presentation", key = randomUUID()) =>
    server.inject({
      method: "POST",
      url: `/v1/projects/${projectId}/announcements`,
      payload: {
        kind,
        introduction: "Uma novidade para a comunidade de Cabo Verde",
        creationKey: key,
      },
    });
  const gate = async () => {
    sign(adminId, "admin");
    expect(
      (
        await server.inject({
          method: "PATCH",
          url: "/v1/admin/settings",
          payload: { "moderation.review_required": true },
        })
      ).statusCode,
    ).toBe(200);
    sign(ownerId);
  };
  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17").start();
    const setup = await setupDB(container.getConnectionUri(), { migrating: true });
    db = setup.db;
    client = setup.dbClient;
    await migrate(db, { migrationsFolder });
  });
  beforeEach(async () => {
    await resetDb(db);
    invalidateSettingsCache();
    ownerId = await insertUser(db);
    otherId = await insertUser(db);
    adminId = await insertUser(db, { role: "admin" });
    publisherId = await insertPublisher(db, ownerId);
    await insertPublisher(db, otherId);
    const categoryId = await insertCategory(db);
    const project = await insertProject(db, {
      publisherId,
      categoryId,
      slug: "community-project",
      launchedAt: null,
    });
    projectId = project.id;
    slug = project.slug;
    server = await buildServer(db);
    await server.ready();
    sign(ownerId);
  });
  afterEach(async () => {
    vi.useRealTimers();
    await server?.close();
    vi.clearAllMocks();
  });
  afterAll(async () => {
    await teardownDB(client);
    await container?.stop();
  });
  it("directory re-publication preserves its first date without an implicit announcement", async () => {
    await db
      .update(projects)
      .set({ status: "draft", publishedAt: "2025-06-05T10:00:00.000Z" })
      .where(eq(projects.id, projectId));
    expect(
      (await server.inject({ method: "POST", url: `/v1/projects/${projectId}/publish` }))
        .statusCode,
    ).toBe(200);
    const directory = await server.inject({ method: "GET", url: "/v1/projects" });
    expect(directory.json().data).toHaveLength(1);
    const week = await server.inject({ method: "GET", url: "/v1/projects?period=this_week" });
    expect(week.json().data).toHaveLength(0);
    expect(await db.query.projectAnnouncements.findMany()).toHaveLength(0);
    expect(new Date((await db.query.projects.findFirst())!.publishedAt!).toISOString()).toBe(
      "2025-06-05T10:00:00.000Z",
    );
  });
  it("creates an idempotent, independently voted announcement and limits one project per week", async () => {
    const key = randomUUID();
    const first = await create("first_release", key);
    expect(first.statusCode).toBe(200);
    expect(first.json().data.week).toBe(currentWeek().weekId);
    const repeated = await create("first_release", key);
    expect(repeated.json().data.id).toBe(first.json().data.id);
    expect((await create("major_update")).statusCode).toBe(409);
    sign(otherId);
    expect(
      (
        await server.inject({
          method: "POST",
          url: `/v1/announcements/${first.json().data.id}/vote`,
        })
      ).statusCode,
    ).toBe(200);
    const feed = await server.inject({ method: "GET", url: "/v1/announcements" });
    expect(feed.json().data[0]).toMatchObject({ votes: 1, hasVoted: true });
    expect(feed.json().data[0]).not.toHaveProperty("creationKey");
    const page = await server.inject({ method: "GET", url: `/v1/projects/${slug}` });
    expect(page.json().data.upvoteCount).toBe(0);
  });
  it("assigns the current Cabo Verde week when delayed moderation approves", async () => {
    await gate();
    const queued = await create();
    expect(queued.json().data).toMatchObject({ status: "pending", week: null, publishedAt: null });
    const oldWeek = currentWeek().weekId;
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(Date.now() + 8 * 86400000));
    sign(adminId, "admin");
    const result = await server.inject({
      method: "POST",
      url: `/v1/admin/community-review/announcements/${queued.json().data.id}`,
      payload: { approve: true },
    });
    expect(result.statusCode).toBe(200);
    const row = await db.query.projectAnnouncements.findFirst();
    expect(row?.week).toBe(currentWeek().weekId);
    expect(row?.week).not.toBe(oldWeek);
    expect(await db.query.moderationActions.findMany()).toHaveLength(2);
  });
  it("credits invited makers only after the invited account accepts", async () => {
    const other = await db.query.publishers.findFirst({ where: eq(publishers.userId, otherId) });
    const invite = await server.inject({
      method: "POST",
      url: `/v1/projects/${projectId}/makers`,
      payload: { handle: other!.handle },
    });
    expect(invite.statusCode).toBe(200);
    const id = invite.json().data.id;
    sign(null);
    expect(
      (await server.inject({ method: "GET", url: `/v1/projects/${projectId}/makers` })).json().data,
    ).toHaveLength(0);
    sign(adminId, "admin");
    expect(
      (
        await server.inject({
          method: "POST",
          url: `/v1/maker-invitations/${id}`,
          payload: { accept: true },
        })
      ).statusCode,
    ).toBe(404);
    sign(otherId);
    expect(
      (await server.inject({ method: "GET", url: "/v1/maker-invitations" })).json().data,
    ).toHaveLength(1);
    await db
      .update(users)
      .set({ shadowBannedAt: new Date() })
      .where(eq(users.id, ownerId));
    expect(
      (await server.inject({ method: "GET", url: "/v1/maker-invitations" })).json().data,
    ).toHaveLength(0);
    expect(
      (
        await server.inject({
          method: "POST",
          url: `/v1/maker-invitations/${id}`,
          payload: { accept: true },
        })
      ).statusCode,
    ).toBe(404);
    await db.update(users).set({ shadowBannedAt: null }).where(eq(users.id, ownerId));
    expect(
      (
        await server.inject({
          method: "POST",
          url: `/v1/maker-invitations/${id}`,
          payload: { accept: true },
        })
      ).statusCode,
    ).toBe(200);
    sign(null);
    const visible = await server.inject({ method: "GET", url: `/v1/projects/${projectId}/makers` });
    expect(visible.json().data[0]).toMatchObject({ userId: otherId, status: "accepted" });
    expect(visible.json().data[0]).not.toHaveProperty("email");
    const profile = await server.inject({ method: "GET", url: `/v1/makers/${other!.handle}` });
    expect(profile.json().data.projectCount).toBe(1);
  });
  it("keeps the approved page live while material edits wait, then applies approval atomically", async () => {
    await gate();
    const patch = await server.inject({
      method: "PATCH",
      url: `/v1/projects/${projectId}`,
      payload: { name: "Nova versão aprovada", description: "<p>Descrição nova</p>" },
    });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().data.pendingReview).toBe(true);
    const owned = await server.inject({ method: "GET", url: `/v1/projects/${slug}` });
    const revision = owned.json().data.editReview;
    expect(revision.body.name).toBe("Nova versão aprovada");
    sign(null);
    const publicPage = await server.inject({ method: "GET", url: `/v1/projects/${slug}` });
    expect(publicPage.json().data.name).toBe("Meu Projeto");
    expect(publicPage.json().data).not.toHaveProperty("editReview");
    sign(adminId, "admin");
    const approval = await server.inject({
      method: "POST",
      url: `/v1/admin/community-review/revisions/${revision.id}`,
      payload: { approve: true },
    });
    expect(approval.statusCode).toBe(200);
    sign(null);
    const updated = await server.inject({ method: "GET", url: `/v1/projects/${slug}` });
    expect(updated.json().data.name).toBe("Nova versão aprovada");
    expect(updated.json().data.status).toBe("published");
  });
  it("rejects replaced and stale proposals without publishing unreviewed changes", async () => {
    await gate();
    await server.inject({
      method: "PATCH",
      url: `/v1/projects/${projectId}`,
      payload: { name: "Proposta um" },
    });
    const first = await db.query.projectRevisions.findFirst();
    await server.inject({
      method: "PATCH",
      url: `/v1/projects/${projectId}`,
      payload: { name: "Proposta dois" },
    });
    sign(adminId, "admin");
    expect(
      (
        await server.inject({
          method: "POST",
          url: `/v1/admin/community-review/revisions/${first!.id}`,
          payload: { approve: true },
        })
      ).statusCode,
    ).toBe(404);
    const active = await db.query.projectRevisions.findFirst({
      where: eq(projectRevisions.status, "pending"),
    });
    await db
      .update(projects)
      .set({ rowVersion: sql`${projects.rowVersion} + 1` })
      .where(eq(projects.id, projectId));
    expect(
      (
        await server.inject({
          method: "POST",
          url: `/v1/admin/community-review/revisions/${active!.id}`,
          payload: { approve: true },
        })
      ).statusCode,
    ).toBe(409);
    expect((await db.query.projects.findFirst())?.name).toBe("Meu Projeto");
  });
  it("returns rejected proposal feedback only to the owner, and requires moderation authorization", async () => {
    await gate();
    await server.inject({
      method: "PATCH",
      url: `/v1/projects/${projectId}`,
      payload: { name: "Proposta rejeitada" },
    });
    const revision = await db.query.projectRevisions.findFirst();
    sign(otherId);
    expect(
      (
        await server.inject({
          method: "POST",
          url: `/v1/admin/community-review/revisions/${revision!.id}`,
          payload: { approve: true },
        })
      ).statusCode,
    ).toBe(403);
    sign(adminId, "admin");
    expect(
      (
        await server.inject({
          method: "POST",
          url: `/v1/admin/community-review/revisions/${revision!.id}`,
          payload: { approve: false },
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await server.inject({
          method: "POST",
          url: `/v1/admin/community-review/revisions/${revision!.id}`,
          payload: { approve: false, reason: "Explica melhor a mudança de propósito." },
        })
      ).statusCode,
    ).toBe(200);
    sign(ownerId);
    const own = await server.inject({ method: "GET", url: `/v1/projects/${slug}` });
    expect(own.json().data.editReview).toMatchObject({
      status: "rejected",
      body: { name: "Proposta rejeitada" },
    });
    sign(null);
    expect(
      (await server.inject({ method: "GET", url: `/v1/projects/${slug}` })).json().data,
    ).not.toHaveProperty("editReview");
  });
  it("keeps harmless empty optional-field corrections immediate", async () => {
    await gate();
    const patch = await server.inject({
      method: "PATCH",
      url: `/v1/projects/${projectId}`,
      payload: { description: "<p><br></p>", teamDescription: "", helpDescription: "" },
    });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().data.pendingReview).toBeUndefined();
    expect(await db.query.projectRevisions.findMany()).toHaveLength(0);
  });
  it("rechecks first-release availability at approval and lets staff reject an obsolete announcement", async () => {
    await gate();
    const queued = await create("first_release");
    expect(queued.statusCode).toBe(200);
    await server.inject({
      method: "PATCH",
      url: `/v1/projects/${projectId}`,
      payload: { availability: "unavailable" },
    });
    sign(adminId, "admin");
    expect(
      (
        await server.inject({
          method: "POST",
          url: `/v1/admin/community-review/announcements/${queued.json().data.id}`,
          payload: { approve: true },
        })
      ).statusCode,
    ).toBe(409);
    await db.update(projects).set({ status: "draft" }).where(eq(projects.id, projectId));
    expect(
      (
        await server.inject({
          method: "POST",
          url: `/v1/admin/community-review/announcements/${queued.json().data.id}`,
          payload: { approve: false, reason: "O projeto não está disponível para lançamento." },
        })
      ).statusCode,
    ).toBe(200);
  });
  it("lets staff reject obsolete revisions without reopening a withdrawn page", async () => {
    await gate();
    await server.inject({
      method: "PATCH",
      url: `/v1/projects/${projectId}`,
      payload: { name: "Proposta retirada" },
    });
    const revision = await db.query.projectRevisions.findFirst();
    await db.update(projects).set({ status: "draft" }).where(eq(projects.id, projectId));
    sign(adminId, "admin");
    expect(
      (
        await server.inject({
          method: "POST",
          url: `/v1/admin/community-review/revisions/${revision!.id}`,
          payload: { approve: false, reason: "A página foi retirada enquanto aguardava revisão." },
        })
      ).statusCode,
    ).toBe(200);
    expect((await db.query.projects.findFirst())?.status).toBe("draft");
  });
  it("removes announcements and votes from visibility when the project is hidden", async () => {
    const announcement = await create();
    await db
      .update(projects)
      .set({ shadowBannedAt: new Date().toISOString() })
      .where(eq(projects.id, projectId));
    sign(otherId);
    expect(
      (await server.inject({ method: "GET", url: "/v1/announcements" })).json().data,
    ).toHaveLength(0);
    expect(
      (
        await server.inject({
          method: "POST",
          url: `/v1/announcements/${announcement.json().data.id}/vote`,
        })
      ).statusCode,
    ).toBe(404);
  });
});
