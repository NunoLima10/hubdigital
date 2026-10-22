import { setupDB, teardownDB } from "@/db";
import { fileUploads, users } from "@/db/schemas";
import { buildServer } from "@/server";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import type { FastifyInstance } from "fastify";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import "../setup-env";
import { insertUser, migrationsFolder, resetDb } from "./helpers/admin-harness";

const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }));

vi.mock("../../src/lib/auth", () => ({
  auth: { api: { getSession: getSessionMock }, handler: vi.fn() },
}));

describe("Account avatar (e2e)", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
  let connectionUri: string;
  let dbClient: Awaited<ReturnType<typeof setupDB>>["dbClient"];
  let db: Awaited<ReturnType<typeof setupDB>>["db"];
  let server: FastifyInstance;
  let userId: string;
  let otherUserId: string;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17").start();
    connectionUri = container.getConnectionUri();
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

    userId = await insertUser(db, { role: "user", name: "Ana" });
    otherUserId = await insertUser(db, { role: "user", name: "Rui" });
    getSessionMock.mockResolvedValue({ user: { id: userId, role: "user" } });

    server = await buildServer(db);
    await server.ready();
  });

  afterEach(async () => {
    if (server) await server.close();
    if (dbClient) await teardownDB(dbClient);
  });

  afterAll(async () => {
    if (container) await container.stop();
  });

  async function insertUpload(key: string, owner: string, completed = true) {
    await db.insert(fileUploads).values({
      key,
      userId: owner,
      type: "user_avatar",
      contentType: "image/png",
      byteSize: 100,
      completedAt: completed ? new Date().toISOString() : null,
    });
  }

  async function imageOf(id: string) {
    const [row] = await db.select({ image: users.image }).from(users).where(eq(users.id, id));
    return row.image;
  }

  function putAvatar(key: string | null) {
    return server.inject({ method: "PUT", url: "/v1/users/me/avatar", payload: { key } });
  }

  it("sets the photo from the user's own finished upload, as a public URL", async () => {
    await insertUpload("user_avatar/abc-eu.png", userId);

    const response = await putAvatar("user_avatar/abc-eu.png");

    expect(response.statusCode).toBe(200);
    const image = "https://assets.test.hubdigital.cv/user_avatar/abc-eu.png";
    expect(response.json()).toEqual({ data: { image } });
    expect(await imageOf(userId)).toBe(image);
  });

  it("refuses someone else's upload", async () => {
    await insertUpload("user_avatar/abc-rui.png", otherUserId);

    const response = await putAvatar("user_avatar/abc-rui.png");

    expect(response.statusCode).toBe(400);
    expect(await imageOf(userId)).toBeNull();
  });

  it("refuses an upload that never finished", async () => {
    await insertUpload("user_avatar/abc-meio.png", userId, false);

    expect((await putAvatar("user_avatar/abc-meio.png")).statusCode).toBe(400);
  });

  it("refuses a key of another upload type", async () => {
    expect((await putAvatar("project_logo/abc-logo.png")).statusCode).toBe(400);
  });

  it("removes the photo with null", async () => {
    await db.update(users).set({ image: "https://example.com/a.png" }).where(eq(users.id, userId));

    const response = await putAvatar(null);

    expect(response.statusCode).toBe(200);
    expect(await imageOf(userId)).toBeNull();
  });

  it("answers 401 when signed out", async () => {
    getSessionMock.mockResolvedValue(null);

    expect((await putAvatar(null)).statusCode).toBe(401);
  });
});
