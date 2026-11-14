import { setupDB, teardownDB } from "@/db";
import { ADMIN_ROLES } from "@/lib/plugins/admin";
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

describe("Admin access control (e2e)", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
  let connectionUri: string;
  let dbClient: Awaited<ReturnType<typeof setupDB>>["dbClient"];
  let db: Awaited<ReturnType<typeof setupDB>>["db"];
  let server: FastifyInstance;
  let adminId: string;
  let userId: string;

  function signedInAs(id: string, role: string) {
    getSessionMock.mockResolvedValue({ user: { id, role } });
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
    userId = await insertUser(db, { role: "user", name: "Utilizador" });

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

  /**
   * The regression this whole module exists to prevent: `adminRoles` used to be
   * `["admin", "user"]`, which — with `defaultRole: "user"` — handed Better
   * Auth's entire admin surface to every signed-in account.
   */
  it("never treats the default user role as staff", () => {
    expect(ADMIN_ROLES).not.toContain("user");
    expect(ADMIN_ROLES).toEqual(["admin"]);
  });

  it("answers 401 to an anonymous request", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await server.inject({ method: "GET", url: "/v1/admin/stats" });

    expect(response.statusCode).toBe(401);
  });

  it("answers 403 to a signed-in non-admin", async () => {
    signedInAs(userId, "user");

    const response = await server.inject({ method: "GET", url: "/v1/admin/stats" });

    expect(response.statusCode).toBe(403);
  });

  it("lets an admin through", async () => {
    signedInAs(adminId, "admin");

    const response = await server.inject({ method: "GET", url: "/v1/admin/stats" });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.queue.pending).toBe(0);
  });

  it("guards every mutating admin route, not only the reads", async () => {
    signedInAs(userId, "user");

    const routes = [
      { method: "POST" as const, url: "/v1/admin/projects/1/approve" },
      { method: "POST" as const, url: "/v1/admin/projects/1/reject" },
      { method: "POST" as const, url: "/v1/admin/projects/1/shadow-ban" },
      { method: "POST" as const, url: "/v1/admin/users/abc/shadow-ban" },
      { method: "POST" as const, url: "/v1/admin/comments/1/hide" },
      { method: "PATCH" as const, url: "/v1/admin/settings" },
    ];

    for (const route of routes) {
      const response = await server.inject({
        ...route,
        payload: { reason: "motivo suficientemente longo" },
      });

      // 403 before validation: a non-admin must not learn what the body should
      // look like by getting a 400 back.
      expect(response.statusCode, route.url).toBe(403);
    }
  });

  it("keeps the public settings endpoint open to everyone", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await server.inject({
      method: "GET",
      url: "/v1/settings/public",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toEqual({
      "submissions.open": true,
      "announcement.text": null,
    });
  });
});
