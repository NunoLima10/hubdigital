import { setupDB, teardownDB } from "@/db";
import { comments, moderationActions } from "@/db/schemas";
import { buildServer } from "@/server";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
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

const REASON = "Não corresponde às regras da plataforma.";

describe("Admin audit log (e2e)", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
  let connectionUri: string;
  let dbClient: Awaited<ReturnType<typeof setupDB>>["dbClient"];
  let db: Awaited<ReturnType<typeof setupDB>>["db"];
  let server: FastifyInstance;

  let adminId: string;
  let makerId: string;
  let publisherId: number;
  let categoryId: number;

  function signedInAs(id: string, role = "user") {
    getSessionMock.mockResolvedValue({ user: { id, role } });
  }

  async function auditRows() {
    return db.select().from(moderationActions);
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

    const setupResult = await setupDB(connectionUri);
    db = setupResult.db;
    dbClient = setupResult.dbClient;

    await resetDb(db);

    adminId = await insertUser(db, {
      role: "admin",
      name: "Admin",
      email: "admin@hubdigital.cv",
    });
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

  it("records one row per action, with the actor and the reason", async () => {
    const project = await insertProject(db, {
      publisherId,
      categoryId,
      slug: "auditado",
      status: "pending",
      launchedAt: null,
    });

    signedInAs(adminId, "admin");

    await server.inject({
      method: "POST",
      url: `/v1/admin/projects/${project.id}/reject`,
      payload: { reason: REASON },
    });

    const rows = await auditRows();

    expect(rows).toHaveLength(1);
    expect(rows[0].action).toBe("project.reject");
    expect(rows[0].targetType).toBe("project");
    expect(rows[0].targetId).toBe(String(project.id));
    expect(rows[0].reason).toBe(REASON);
    expect(rows[0].actorId).toBe(adminId);
    // The email snapshot is what keeps the row readable if the account goes.
    expect(rows[0].actorEmail).toBe("admin@hubdigital.cv");
  });

  /**
   * The reason `withAudit` runs inside a transaction rather than as a response
   * hook: an action that changed nothing must not leave a log entry claiming it
   * happened.
   */
  it("writes nothing when the action changed nothing", async () => {
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
    expect(await auditRows()).toHaveLength(0);
  });

  it("writes one row per comment in a batch, not one per request", async () => {
    const project = await insertProject(db, {
      publisherId,
      categoryId,
      slug: "com-lote",
    });

    const inserted = await db
      .insert(comments)
      .values([
        { projectId: project.id, userId: makerId, body: "Primeiro" },
        { projectId: project.id, userId: makerId, body: "Segundo" },
      ])
      .returning({ id: comments.id });

    signedInAs(adminId, "admin");

    await server.inject({
      method: "POST",
      url: "/v1/admin/comments/bulk",
      payload: {
        ids: inserted.map((row) => row.id),
        action: "hide",
        reason: REASON,
      },
    });

    const rows = await auditRows();

    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.action === "comment.hide")).toBe(true);
    // Queried by target, a batch entry would be invisible from a comment's own
    // history — hence one row each.
    expect(rows.map((row) => row.targetId).sort()).toEqual(
      inserted.map((row) => String(row.id)).sort()
    );
  });

  it("records a settings change with what it was and what it became", async () => {
    signedInAs(adminId, "admin");

    await server.inject({
      method: "PATCH",
      url: "/v1/admin/settings",
      payload: { "moderation.review_required": true },
    });

    const rows = await auditRows();

    expect(rows).toHaveLength(1);
    expect(rows[0].action).toBe("setting.update");
    expect(rows[0].targetType).toBe("setting");

    const metadata = rows[0].metadata as {
      before: Record<string, unknown>;
      after: Record<string, unknown>;
    };

    expect(metadata.before["moderation.review_required"]).toBe(false);
    expect(metadata.after["moderation.review_required"]).toBe(true);
  });

  it("serves the log filtered by target", async () => {
    const project = await insertProject(db, {
      publisherId,
      categoryId,
      slug: "com-historico",
      status: "pending",
      launchedAt: null,
    });

    signedInAs(adminId, "admin");

    await server.inject({
      method: "POST",
      url: `/v1/admin/projects/${project.id}/reject`,
      payload: { reason: REASON },
    });

    const filtered = await server.inject({
      method: "GET",
      url: `/v1/admin/audit?targetType=project&targetId=${project.id}`,
    });

    expect(filtered.statusCode).toBe(200);
    expect(filtered.json().data).toHaveLength(1);
    expect(filtered.json().data[0].actor.name).toBe("Admin");

    const unrelated = await server.inject({
      method: "GET",
      url: "/v1/admin/audit?targetType=user",
    });

    expect(unrelated.json().data).toHaveLength(0);
  });

  it("attaches the history to the project it belongs to", async () => {
    const project = await insertProject(db, {
      publisherId,
      categoryId,
      slug: "com-detalhe",
      status: "pending",
      launchedAt: null,
    });

    signedInAs(adminId, "admin");

    await server.inject({
      method: "POST",
      url: `/v1/admin/projects/${project.id}/reject`,
      payload: { reason: REASON },
    });

    const detail = await server.inject({
      method: "GET",
      url: `/v1/admin/projects/${project.id}`,
    });

    expect(detail.statusCode).toBe(200);
    expect(detail.json().data.history).toHaveLength(1);
    expect(detail.json().data.history[0].reason).toBe(REASON);
  });

  it("exposes no way to alter the log", async () => {
    signedInAs(adminId, "admin");

    for (const method of ["POST", "PATCH", "DELETE"] as const) {
      const response = await server.inject({
        method,
        url: "/v1/admin/audit",
        payload: {},
      });

      expect(response.statusCode, method).toBe(404);
    }
  });
});
