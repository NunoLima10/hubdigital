import { setupDB, teardownDB } from "@/db";
import { projects, publishers } from "@/db/schemas";
import { invalidateSettingsCache } from "@/modules/settings/settings-services";
import { buildServer } from "@/server";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import type { FastifyInstance } from "fastify";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import "../setup-env";
import {
  insertCategory,
  insertProject,
  insertPublisher,
  insertUser,
  migrationsFolder,
  resetDb,
} from "./helpers/admin-harness";

const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }));

vi.mock("../../src/lib/auth", () => ({
  auth: {
    api: { getSession: getSessionMock, updateUser: vi.fn() },
    handler: vi.fn(),
  },
}));

describe("Admin review queue (e2e)", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
  let connectionUri: string;
  let dbClient: Awaited<ReturnType<typeof setupDB>>["dbClient"];
  let db: Awaited<ReturnType<typeof setupDB>>["db"];
  let server: FastifyInstance;

  let adminId: string;
  let makerId: string;
  let publisherId: number;
  let categoryId: number;

  function signedInAs(id: string, role: string) {
    getSessionMock.mockResolvedValue({ user: { id, role } });
  }

  async function setReviewRequired(value: boolean) {
    signedInAs(adminId, "admin");

    const response = await server.inject({
      method: "PATCH",
      url: "/v1/admin/settings",
      payload: { "moderation.review_required": value },
    });

    expect(response.statusCode).toBe(200);
  }

  async function publishAsMaker(projectId: number) {
    signedInAs(makerId, "user");

    return server.inject({
      method: "POST",
      url: `/v1/projects/${projectId}/publish`,
    });
  }

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17").start();
    connectionUri = container.getConnectionUri();
    process.env.DATABASE_URL = connectionUri;

    const setupResult = await setupDB(connectionUri, { migrating: true });
    await migrate(setupResult.db, { migrationsFolder });
    await teardownDB(setupResult.dbClient);
  });

  beforeEach(async () => {
    getSessionMock.mockReset();
    // Settings are cached in the process, so a value written by the previous
    // test would otherwise survive into this one.
    invalidateSettingsCache();

    const setupResult = await setupDB(connectionUri);
    db = setupResult.db;
    dbClient = setupResult.dbClient;

    await resetDb(db);

    adminId = await insertUser(db, { role: "admin", name: "Admin" });
    makerId = await insertUser(db, { role: "user", name: "Maker" });
    publisherId = await insertPublisher(db, makerId);
    categoryId = await insertCategory(db);

    server = await buildServer(db);
    await server.ready();
  });

  afterEach(async () => {
    if (server) await server.close();
    if (dbClient) await teardownDB(dbClient);
    vi.clearAllMocks();
  });

  afterAll(async () => {
    if (container) await container.stop();
  });

  it("publishes straight through while the gate is off", async () => {
    const project = await insertProject(db, {
      publisherId,
      categoryId,
      slug: "direto",
      status: "draft",
      launchedAt: null,
    });

    const response = await publishAsMaker(project.id);

    expect(response.statusCode).toBe(200);
    expect(response.json().data.status).toBe("published");
  });

  it("queues a publish and keeps it off the public site while the gate is on", async () => {
    await setReviewRequired(true);

    const project = await insertProject(db, {
      publisherId,
      categoryId,
      slug: "em-revisao",
      status: "draft",
      launchedAt: null,
    });

    const publish = await publishAsMaker(project.id);

    expect(publish.statusCode).toBe(200);
    expect(publish.json().data.status).toBe("pending");

    getSessionMock.mockResolvedValue(null);

    const list = await server.inject({
      method: "GET",
      url: "/v1/projects?period=all",
    });

    expect(list.json().data).toHaveLength(0);

    const detail = await server.inject({
      method: "GET",
      url: "/v1/projects/em-revisao",
    });

    expect(detail.statusCode).toBe(404);
  });

  it("shows a queued project to the moderator in queue order", async () => {
    await setReviewRequired(true);

    const first = await insertProject(db, {
      publisherId,
      categoryId,
      slug: "primeiro",
      status: "draft",
      launchedAt: null,
    });
    const second = await insertProject(db, {
      publisherId,
      categoryId,
      slug: "segundo",
      status: "draft",
      launchedAt: null,
    });

    await publishAsMaker(first.id);
    await publishAsMaker(second.id);

    signedInAs(adminId, "admin");

    const queue = await server.inject({
      method: "GET",
      url: "/v1/admin/projects?status=pending&sort=queued",
    });

    expect(queue.statusCode).toBe(200);
    expect(queue.json().data.map((p: { slug: string }) => p.slug)).toEqual([
      "primeiro",
      "segundo",
    ]);
  });

  it("approves a queued project into the public listing", async () => {
    await setReviewRequired(true);

    const project = await insertProject(db, {
      publisherId,
      categoryId,
      slug: "aprovado",
      status: "draft",
      launchedAt: null,
    });

    await publishAsMaker(project.id);

    signedInAs(adminId, "admin");

    const approve = await server.inject({
      method: "POST",
      url: `/v1/admin/projects/${project.id}/approve`,
      payload: {},
    });

    expect(approve.statusCode).toBe(200);
    expect(approve.json().data.status).toBe("published");

    getSessionMock.mockResolvedValue(null);

    const list = await server.inject({
      method: "GET",
      url: "/v1/projects?period=all",
    });

    expect(list.json().data.map((p: { slug: string }) => p.slug)).toEqual([
      "aprovado",
    ]);
  });

  /**
   * A project that already had a launch date keeps it, so a slow review cannot
   * move a maker into a fresh ranking window.
   */
  it("leaves an existing launch date alone on approval", async () => {
    const launchedAt = "2026-01-05T10:00:00.000Z";

    const project = await insertProject(db, {
      publisherId,
      categoryId,
      slug: "relancado",
      status: "pending",
      queuedAt: new Date().toISOString(),
      launchedAt,
    });

    signedInAs(adminId, "admin");

    await server.inject({
      method: "POST",
      url: `/v1/admin/projects/${project.id}/approve`,
      payload: {},
    });

    const row = await db.query.projects.findFirst({
      where: eq(projects.id, project.id),
      columns: { launchedAt: true },
    });

    expect(new Date(row!.launchedAt!).toISOString()).toBe(launchedAt);
  });

  it("rejects with a reason its maker can read and nobody else can", async () => {
    const project = await insertProject(db, {
      publisherId,
      categoryId,
      slug: "rejeitado",
      status: "pending",
      queuedAt: new Date().toISOString(),
      launchedAt: null,
    });

    signedInAs(adminId, "admin");

    const reject = await server.inject({
      method: "POST",
      url: `/v1/admin/projects/${project.id}/reject`,
      payload: { reason: "O link do site não está a funcionar." },
    });

    expect(reject.statusCode).toBe(200);
    expect(reject.json().data.status).toBe("rejected");

    signedInAs(makerId, "user");

    const mine = await server.inject({ method: "GET", url: "/v1/projects/mine" });

    expect(mine.json().data[0].rejectionReason).toBe(
      "O link do site não está a funcionar."
    );

    getSessionMock.mockResolvedValue(null);

    const detail = await server.inject({
      method: "GET",
      url: "/v1/projects/rejeitado",
    });

    expect(detail.statusCode).toBe(404);
  });

  it("puts a resubmission back in the queue and clears the old reason", async () => {
    await setReviewRequired(true);

    const project = await insertProject(db, {
      publisherId,
      categoryId,
      slug: "reenviado",
      status: "rejected",
      rejectionReason: "Faltava a descrição.",
      launchedAt: null,
    });

    const publish = await publishAsMaker(project.id);

    expect(publish.json().data.status).toBe("pending");

    const row = await db.query.projects.findFirst({
      where: eq(projects.id, project.id),
      columns: { rejectionReason: true, queuedAt: true },
    });

    expect(row!.rejectionReason).toBeNull();
    expect(row!.queuedAt).not.toBeNull();
  });

  it("lets a trusted publisher skip the queue", async () => {
    await setReviewRequired(true);

    await db
      .update(publishers)
      .set({ trustedAt: new Date().toISOString() })
      .where(eq(publishers.id, publisherId));

    const project = await insertProject(db, {
      publisherId,
      categoryId,
      slug: "de-confianca",
      status: "draft",
      launchedAt: null,
    });

    const publish = await publishAsMaker(project.id);

    expect(publish.json().data.status).toBe("published");
  });

  it("refuses to approve something that is not waiting for review", async () => {
    const project = await insertProject(db, {
      publisherId,
      categoryId,
      slug: "ja-publicado",
    });

    signedInAs(adminId, "admin");

    const approve = await server.inject({
      method: "POST",
      url: `/v1/admin/projects/${project.id}/approve`,
      payload: {},
    });

    expect(approve.statusCode).toBe(404);
  });

  it("requires a real reason to reject", async () => {
    const project = await insertProject(db, {
      publisherId,
      categoryId,
      slug: "sem-motivo",
      status: "pending",
      launchedAt: null,
    });

    signedInAs(adminId, "admin");

    const reject = await server.inject({
      method: "POST",
      url: `/v1/admin/projects/${project.id}/reject`,
      payload: { reason: "spam" },
    });

    expect(reject.statusCode).toBe(400);
  });
});
