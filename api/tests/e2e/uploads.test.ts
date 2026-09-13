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
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import type { FastifyInstance } from "fastify";
import "../setup-env";
import { setupDB, teardownDB } from "../../src/db";
import { fileUploads, users } from "@/db/schemas";
import { buildServer } from "@/server";

const { getSessionMock, getSignedUrlMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  getSignedUrlMock: vi.fn(),
}));

vi.mock("../../src/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
      updateUser: vi.fn(),
    },
    handler: vi.fn(),
  },
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: getSignedUrlMock,
}));

const migrationsFolder = join(__dirname, "../../src/db/migrations");

const validUploadPayload = {
  name: "logo.png",
  contentType: "image/png",
  type: "project_logo",
} as const;

describe("Uploads module (e2e)", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
  let connectionUri: string;

  let dbClient: Awaited<ReturnType<typeof setupDB>>["dbClient"];
  let db: Awaited<ReturnType<typeof setupDB>>["db"];
  let server: FastifyInstance;
  let currentUserId: string;

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
    getSignedUrlMock.mockReset();
    getSignedUrlMock.mockResolvedValue("https://r2.test/signed-put-url");

    const setupResult = await setupDB(connectionUri);
    db = setupResult.db;
    dbClient = setupResult.dbClient;

    await db.delete(fileUploads);
    await db.delete(users);

    currentUserId = randomUUID();
    await db.insert(users).values({
      id: currentUserId,
      name: "Test User",
      email: `test-${currentUserId}@example.com`,
      role: "user",
    });

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

  it("rejects an upload request when the user is unauthenticated", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await server.inject({
      method: "POST",
      url: "/v1/uploads",
      payload: validUploadPayload,
    });

    expect(response.statusCode).toBe(401);
    expect(getSignedUrlMock).not.toHaveBeenCalled();

    const records = await db.query.fileUploads.findMany();
    expect(records).toHaveLength(0);
  });

  it("returns a pre-signed url and records the upload", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: currentUserId, role: "user" },
    });

    const response = await server.inject({
      method: "POST",
      url: "/v1/uploads",
      payload: validUploadPayload,
    });

    expect(response.statusCode).toBe(201);

    const body = response.json();
    expect(body.data.uploadUrl).toBe("https://r2.test/signed-put-url");
    expect(body.data.fileKey).toMatch(/^project_logo\/[\w-]+-logo\.png$/);

    const records = await db.query.fileUploads.findMany();
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      key: body.data.fileKey,
      userId: currentUserId,
      type: "project_logo",
      contentType: "image/png",
    });
  });

  it("rejects a content type that is not an allowed image", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: currentUserId, role: "user" },
    });

    const response = await server.inject({
      method: "POST",
      url: "/v1/uploads",
      payload: { ...validUploadPayload, contentType: "application/pdf" },
    });

    expect(response.statusCode).toBe(400);
    expect(getSignedUrlMock).not.toHaveBeenCalled();

    const records = await db.query.fileUploads.findMany();
    expect(records).toHaveLength(0);
  });

  it("strips directories out of the submitted file name", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: currentUserId, role: "user" },
    });

    const response = await server.inject({
      method: "POST",
      url: "/v1/uploads",
      payload: { ...validUploadPayload, name: "../../etc/passwd.png" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().data.fileKey).toMatch(
      /^project_logo\/[\w-]+-passwd\.png$/
    );
  });
});
