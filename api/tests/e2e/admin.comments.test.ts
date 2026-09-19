import { setupDB, teardownDB } from "@/db";
import { comments } from "@/db/schemas";
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

const REASON = "Linguagem ofensiva contra outro utilizador.";

describe("Admin comment moderation (e2e)", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
  let connectionUri: string;
  let dbClient: Awaited<ReturnType<typeof setupDB>>["dbClient"];
  let db: Awaited<ReturnType<typeof setupDB>>["db"];
  let server: FastifyInstance;

  let adminId: string;
  let makerId: string;
  let commenterId: string;
  let projectId: number;

  function signedInAs(id: string, role = "user") {
    getSessionMock.mockResolvedValue({ user: { id, role } });
  }

  function signedOut() {
    getSessionMock.mockResolvedValue(null);
  }

  async function publicThread() {
    const response = await server.inject({
      method: "GET",
      url: "/v1/projects/com-thread/comments",
    });

    expect(response.statusCode).toBe(200);
    return response.json().data;
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

    adminId = await insertUser(db, { role: "admin", name: "Admin" });
    makerId = await insertUser(db, { role: "user", name: "Maker" });
    commenterId = await insertUser(db, { role: "user", name: "Comentador" });

    const publisherId = await insertPublisher(db, makerId);
    const categoryId = await insertCategory(db);

    const project = await insertProject(db, {
      publisherId,
      categoryId,
      slug: "com-thread",
    });
    projectId = project.id;

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

  async function seedThread() {
    const [parent] = await db
      .insert(comments)
      .values({ projectId, userId: commenterId, body: "Comentário original" })
      .returning({ id: comments.id });

    const [reply] = await db
      .insert(comments)
      .values({
        projectId,
        userId: makerId,
        parentId: parent.id,
        body: "Uma resposta",
      })
      .returning({ id: comments.id });

    return { parentId: parent.id, replyId: reply.id };
  }

  it("removes a hidden comment from the public thread", async () => {
    const { parentId, replyId } = await seedThread();

    signedInAs(adminId, "admin");

    const hide = await server.inject({
      method: "POST",
      url: `/v1/admin/comments/${replyId}/hide`,
      payload: { reason: REASON },
    });

    expect(hide.statusCode).toBe(200);

    signedOut();

    const thread = await publicThread();

    expect(thread).toHaveLength(1);
    expect(thread[0].id).toBe(parentId);
    expect(thread[0].replies).toHaveLength(0);
  });

  it("restores the thread exactly when the hide is lifted", async () => {
    const { replyId } = await seedThread();

    signedInAs(adminId, "admin");

    await server.inject({
      method: "POST",
      url: `/v1/admin/comments/${replyId}/hide`,
      payload: { reason: REASON },
    });

    await server.inject({
      method: "DELETE",
      url: `/v1/admin/comments/${replyId}/hide`,
    });

    signedOut();

    const thread = await publicThread();

    expect(thread[0].replies).toHaveLength(1);
    expect(thread[0].replies[0].body).toBe("Uma resposta");
  });

  it("hides the replies with a hidden parent, without deleting them", async () => {
    const { parentId, replyId } = await seedThread();

    signedInAs(adminId, "admin");

    await server.inject({
      method: "POST",
      url: `/v1/admin/comments/${parentId}/hide`,
      payload: { reason: REASON },
    });

    signedOut();

    expect(await publicThread()).toHaveLength(0);

    signedInAs(adminId, "admin");

    // The reply is untouched in the database, so lifting the parent brings the
    // whole thread back.
    const listed = await server.inject({
      method: "GET",
      url: `/v1/admin/comments?projectId=${projectId}`,
    });

    const states = listed
      .json()
      .data.reduce(
        (acc: Record<number, string>, row: { id: number; state: string }) => {
          acc[row.id] = row.state;
          return acc;
        },
        {}
      );

    expect(states[parentId]).toBe("hidden");
    expect(states[replyId]).toBe("visible");

    await server.inject({
      method: "DELETE",
      url: `/v1/admin/comments/${parentId}/hide`,
    });

    signedOut();

    const restored = await publicThread();

    expect(restored).toHaveLength(1);
    expect(restored[0].replies).toHaveLength(1);
  });

  it("keeps the body and the author of a removed comment for staff", async () => {
    const { parentId } = await seedThread();

    signedInAs(adminId, "admin");

    const removed = await server.inject({
      method: "DELETE",
      url: `/v1/admin/comments/${parentId}`,
      payload: { reason: REASON },
    });

    expect(removed.statusCode).toBe(204);

    const listed = await server.inject({
      method: "GET",
      url: `/v1/admin/comments?projectId=${projectId}&state=deleted`,
    });

    const row = listed.json().data[0];

    expect(row.state).toBe("deleted");
    expect(row.body).toBe("Comentário original");
    expect(row.author.name).toBe("Comentador");
    expect(row.moderationReason).toBe(REASON);
  });

  it("hides a batch in one request", async () => {
    const { parentId, replyId } = await seedThread();

    signedInAs(adminId, "admin");

    const bulk = await server.inject({
      method: "POST",
      url: "/v1/admin/comments/bulk",
      payload: { ids: [parentId, replyId], action: "hide", reason: REASON },
    });

    expect(bulk.statusCode).toBe(200);
    expect(bulk.json().data.affected).toHaveLength(2);

    signedOut();

    expect(await publicThread()).toHaveLength(0);
  });

  it("refuses a batch over the cap", async () => {
    signedInAs(adminId, "admin");

    const bulk = await server.inject({
      method: "POST",
      url: "/v1/admin/comments/bulk",
      payload: {
        ids: Array.from({ length: 101 }, (_, index) => index + 1),
        action: "hide",
        reason: REASON,
      },
    });

    expect(bulk.statusCode).toBe(400);
  });

  it("leaves a hidden comment out of the count shown on a card", async () => {
    const { replyId } = await seedThread();

    signedOut();

    const before = await server.inject({
      method: "GET",
      url: "/v1/projects/com-thread",
    });

    expect(before.json().data.commentCount).toBe(2);

    signedInAs(adminId, "admin");

    await server.inject({
      method: "POST",
      url: `/v1/admin/comments/${replyId}/hide`,
      payload: { reason: REASON },
    });

    signedOut();

    const after = await server.inject({
      method: "GET",
      url: "/v1/projects/com-thread",
    });

    expect(after.json().data.commentCount).toBe(1);
  });

  it("requires a reason to hide", async () => {
    const { parentId } = await seedThread();

    signedInAs(adminId, "admin");

    const hide = await server.inject({
      method: "POST",
      url: `/v1/admin/comments/${parentId}/hide`,
      payload: { reason: "spam" },
    });

    expect(hide.statusCode).toBe(400);
  });
});
