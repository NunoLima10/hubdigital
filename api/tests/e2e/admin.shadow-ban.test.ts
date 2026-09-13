import { setupDB, teardownDB } from "@/db";
import { comments, projectUpvotes } from "@/db/schemas";
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

const REASON = "Conteúdo repetido em vários projetos.";

describe("Admin shadow ban (e2e)", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
  let connectionUri: string;
  let dbClient: Awaited<ReturnType<typeof setupDB>>["dbClient"];
  let db: Awaited<ReturnType<typeof setupDB>>["db"];
  let server: FastifyInstance;

  let adminId: string;
  let makerId: string;
  let otherId: string;
  let publisherId: number;
  let categoryId: number;

  function signedInAs(id: string, role = "user") {
    getSessionMock.mockResolvedValue({ user: { id, role } });
  }

  function signedOut() {
    getSessionMock.mockResolvedValue(null);
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
    otherId = await insertUser(db, { role: "user", name: "Outro" });
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

  describe("hiding a project", () => {
    it("keeps it visible to its owner with the reason, and hides it from everyone else", async () => {
      const project = await insertProject(db, {
        publisherId,
        categoryId,
        slug: "oculto",
      });

      signedInAs(adminId, "admin");

      const hide = await server.inject({
        method: "POST",
        url: `/v1/admin/projects/${project.id}/shadow-ban`,
        payload: { reason: REASON },
      });

      expect(hide.statusCode).toBe(200);

      signedInAs(makerId);

      const asOwner = await server.inject({
        method: "GET",
        url: "/v1/projects/oculto",
      });

      expect(asOwner.statusCode).toBe(200);
      expect(asOwner.json().data.hidden).toBe(true);
      expect(asOwner.json().data.hiddenReason).toBe(REASON);

      signedInAs(otherId);

      const asOther = await server.inject({
        method: "GET",
        url: "/v1/projects/oculto",
      });

      expect(asOther.statusCode).toBe(404);

      signedOut();

      const asAnon = await server.inject({
        method: "GET",
        url: "/v1/projects/oculto",
      });

      expect(asAnon.statusCode).toBe(404);
    });

    it("drops it from the public listing and the leaderboard", async () => {
      const hidden = await insertProject(db, {
        publisherId,
        categoryId,
        slug: "fora",
      });
      await insertProject(db, { publisherId, categoryId, slug: "dentro" });

      signedInAs(adminId, "admin");

      await server.inject({
        method: "POST",
        url: `/v1/admin/projects/${hidden.id}/shadow-ban`,
        payload: { reason: REASON },
      });

      signedOut();

      const list = await server.inject({
        method: "GET",
        url: "/v1/projects?period=all",
      });

      expect(list.json().data.map((p: { slug: string }) => p.slug)).toEqual([
        "dentro",
      ]);

      const leaderboard = await server.inject({
        method: "GET",
        url: "/v1/projects/leaderboard",
      });

      expect(
        leaderboard.json().data.map((p: { slug: string }) => p.slug)
      ).toEqual(["dentro"]);
    });

    it("restores it exactly when the hide is lifted", async () => {
      const project = await insertProject(db, {
        publisherId,
        categoryId,
        slug: "restaurado",
      });

      await db.insert(projectUpvotes).values({
        projectId: project.id,
        userId: otherId,
      });

      signedInAs(adminId, "admin");

      await server.inject({
        method: "POST",
        url: `/v1/admin/projects/${project.id}/shadow-ban`,
        payload: { reason: REASON },
      });

      await server.inject({
        method: "DELETE",
        url: `/v1/admin/projects/${project.id}/shadow-ban`,
      });

      signedOut();

      const detail = await server.inject({
        method: "GET",
        url: "/v1/projects/restaurado",
      });

      expect(detail.statusCode).toBe(200);
      // The upvote rows were never touched, so the count comes back intact.
      expect(detail.json().data.upvoteCount).toBe(1);
    });
  });

  describe("hiding a user", () => {
    it("hides their comments from everyone but themselves", async () => {
      const project = await insertProject(db, {
        publisherId,
        categoryId,
        slug: "com-comentarios",
      });

      await db.insert(comments).values([
        { projectId: project.id, userId: otherId, body: "Do utilizador oculto" },
        { projectId: project.id, userId: makerId, body: "De outra pessoa" },
      ]);

      signedInAs(adminId, "admin");

      const hide = await server.inject({
        method: "POST",
        url: `/v1/admin/users/${otherId}/shadow-ban`,
        payload: { reason: REASON },
      });

      expect(hide.statusCode).toBe(200);

      signedInAs(otherId);

      const asAuthor = await server.inject({
        method: "GET",
        url: "/v1/projects/com-comentarios/comments",
      });

      expect(asAuthor.json().data).toHaveLength(2);

      signedInAs(makerId);

      const asOther = await server.inject({
        method: "GET",
        url: "/v1/projects/com-comentarios/comments",
      });

      expect(asOther.json().data).toHaveLength(1);
      expect(asOther.json().data[0].body).toBe("De outra pessoa");

      signedOut();

      const asAnon = await server.inject({
        method: "GET",
        url: "/v1/projects/com-comentarios/comments",
      });

      expect(asAnon.json().data).toHaveLength(1);
    });

    it("takes their projects out of the public listing", async () => {
      await insertProject(db, { publisherId, categoryId, slug: "do-oculto" });

      signedInAs(adminId, "admin");

      await server.inject({
        method: "POST",
        url: `/v1/admin/users/${makerId}/shadow-ban`,
        payload: { reason: REASON },
      });

      signedOut();

      const list = await server.inject({
        method: "GET",
        url: "/v1/projects?period=all",
      });

      expect(list.json().data).toHaveLength(0);

      signedInAs(makerId);

      const asOwner = await server.inject({
        method: "GET",
        url: "/v1/projects/do-oculto",
      });

      expect(asOwner.statusCode).toBe(200);
      expect(asOwner.json().data.hiddenReason).toBe(REASON);
    });

    /**
     * The decision recorded in specs/ADMIN.md §A4: a hide removes content from
     * view and does nothing else. Rankings are never rewritten, so an archived
     * week cannot change after the fact.
     */
    it("never changes an upvote count", async () => {
      const project = await insertProject(db, {
        publisherId,
        categoryId,
        slug: "com-votos",
      });

      await db.insert(projectUpvotes).values({
        projectId: project.id,
        userId: otherId,
      });

      signedOut();

      const before = await server.inject({
        method: "GET",
        url: "/v1/projects/com-votos",
      });

      expect(before.json().data.upvoteCount).toBe(1);

      signedInAs(adminId, "admin");

      await server.inject({
        method: "POST",
        url: `/v1/admin/users/${otherId}/shadow-ban`,
        payload: { reason: REASON },
      });

      signedOut();

      const after = await server.inject({
        method: "GET",
        url: "/v1/projects/com-votos",
      });

      expect(after.json().data.upvoteCount).toBe(1);
    });

    it("refuses to let an admin hide their own account", async () => {
      signedInAs(adminId, "admin");

      const response = await server.inject({
        method: "POST",
        url: `/v1/admin/users/${adminId}/shadow-ban`,
        payload: { reason: REASON },
      });

      expect(response.statusCode).toBe(400);
    });

    it("answers 404 when the hide would change nothing", async () => {
      signedInAs(adminId, "admin");

      const lift = await server.inject({
        method: "DELETE",
        url: `/v1/admin/users/${otherId}/shadow-ban`,
      });

      expect(lift.statusCode).toBe(404);
    });
  });
});
