import { setupDB, teardownDB } from "@/db";
import { buildServer } from "@/server";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import type { FastifyInstance } from "fastify";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import "../setup-env";
import {
  insertCategory,
  insertProject,
  insertPublisher,
  insertUser,
  migrationsFolder,
  resetDb,
} from "./helpers/admin-harness";

vi.mock("../../src/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() }, handler: vi.fn() },
}));

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("Share images (e2e)", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
  let connectionUri: string;
  let dbClient: Awaited<ReturnType<typeof setupDB>>["dbClient"];
  let db: Awaited<ReturnType<typeof setupDB>>["db"];
  let server: FastifyInstance;
  let publisherId: number;
  let categoryId: number;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17").start();
    connectionUri = container.getConnectionUri();
    const setupResult = await setupDB(connectionUri, { migrating: true });
    await migrate(setupResult.db, { migrationsFolder });
    await teardownDB(setupResult.dbClient);
  });

  beforeEach(async () => {
    const setupResult = await setupDB(connectionUri);
    db = setupResult.db;
    dbClient = setupResult.dbClient;
    await resetDb(db);

    const userId = await insertUser(db, { role: "user", name: "Maker" });
    publisherId = await insertPublisher(db, userId);
    categoryId = await insertCategory(db);

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

  it("renders a 1200×630 PNG for a published project", async () => {
    await insertProject(db, { publisherId, categoryId, slug: "praia-app", name: "Praia App" });

    const response = await server.inject({ method: "GET", url: "/v1/share-images/projects/praia-app" });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/png");
    expect(response.headers["cache-control"]).toContain("public");
    const png = response.rawPayload;
    expect(png.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
    // IHDR width and height, big-endian, right after the signature and chunk header.
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });

  it("answers 404 for a draft, so unpublished work never leaks through a card", async () => {
    await insertProject(db, { publisherId, categoryId, slug: "rascunho", status: "draft" });

    const response = await server.inject({ method: "GET", url: "/v1/share-images/projects/rascunho" });

    expect(response.statusCode).toBe(404);
  });

  it("answers 404 for a project that does not exist", async () => {
    const response = await server.inject({ method: "GET", url: "/v1/share-images/projects/nada" });

    expect(response.statusCode).toBe(404);
  });
});
