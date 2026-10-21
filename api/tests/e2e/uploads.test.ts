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

const { getSessionMock, getSignedUrlMock, s3SendMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  getSignedUrlMock: vi.fn(),
  s3SendMock: vi.fn(),
}));

vi.mock("@aws-sdk/client-s3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@aws-sdk/client-s3")>();
  return { ...actual, S3Client: class { send = s3SendMock; destroy() {} } };
});

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
  byteSize: 8,
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
    s3SendMock.mockReset();
    s3SendMock.mockImplementation(async (command) => command.constructor.name === "HeadObjectCommand"
      ? { ContentLength: 8, ContentType: "image/png" }
      : { Body: { transformToByteArray: async () => new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]) } });
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

  it("verifies the actual object before marking an upload complete", async () => {
    getSessionMock.mockResolvedValue({ user: { id: currentUserId, role: "user" } });
    const created = await server.inject({ method: "POST", url: "/v1/uploads", payload: validUploadPayload });
    expect(created.statusCode).toBe(201);
    const { uploadId } = created.json().data;
    const before = await db.query.fileUploads.findFirst();
    expect(before?.completedAt).toBeNull();
    const complete = await server.inject({ method: "POST", url: `/v1/uploads/${uploadId}/complete` });
    expect(complete.statusCode).toBe(200);
    expect(s3SendMock).toHaveBeenCalledTimes(2);
    const after = await db.query.fileUploads.findFirst();
    expect(after?.completedAt).not.toBeNull();
  });

  it("rejects mismatched size, executable content and another user's upload", async () => {
    getSessionMock.mockResolvedValue({ user: { id: currentUserId, role: "user" } });
    const created = await server.inject({ method: "POST", url: "/v1/uploads", payload: validUploadPayload });
    const { uploadId } = created.json().data;
    s3SendMock.mockResolvedValueOnce({ ContentLength: 9, ContentType: "image/png" });
    expect((await server.inject({ method: "POST", url: `/v1/uploads/${uploadId}/complete` })).statusCode).toBe(400);
    s3SendMock.mockResolvedValueOnce({ ContentLength: 8, ContentType: "image/png" });
    s3SendMock.mockResolvedValueOnce({ Body: { transformToByteArray: async () => Buffer.from("<script>") } });
    expect((await server.inject({ method: "POST", url: `/v1/uploads/${uploadId}/complete` })).statusCode).toBe(400);
    expect((await db.query.fileUploads.findFirst())?.completedAt).toBeNull();
    getSessionMock.mockResolvedValue({ user: { id: randomUUID(), role: "user" } });
    expect((await server.inject({ method: "POST", url: `/v1/uploads/${uploadId}/complete` })).statusCode).toBe(404);
  });

  it("rejects oversize uploads and active image formats", async () => {
    getSessionMock.mockResolvedValue({ user: { id: currentUserId, role: "user" } });
    for (const payload of [{ ...validUploadPayload, byteSize: 5 * 1024 * 1024 + 1 }, { ...validUploadPayload, contentType: "image/svg+xml" }]) {
      expect((await server.inject({ method: "POST", url: "/v1/uploads", payload })).statusCode).toBe(400);
    }
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
