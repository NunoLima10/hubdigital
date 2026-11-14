import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import type { FastifyInstance } from "fastify";
import sharp from "sharp";
import "../setup-env";
import { setupDB, teardownDB } from "../../src/db";
import { fileUploads, users } from "@/db/schemas";
import { buildServer } from "@/server";

const { getSessionMock, s3SendMock } = vi.hoisted(() => ({ getSessionMock: vi.fn(), s3SendMock: vi.fn() }));
vi.mock("@aws-sdk/client-s3", async (original) => ({
  ...await original<typeof import("@aws-sdk/client-s3")>(),
  S3Client: class { send = s3SendMock; destroy() {} },
}));
vi.mock("../../src/lib/auth", () => ({ auth: { api: { getSession: getSessionMock, updateUser: vi.fn() }, handler: vi.fn() } }));

const migrationsFolder = join(__dirname, "../../src/db/migrations");
describe("verified immutable uploads (e2e)", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
  let db: Awaited<ReturnType<typeof setupDB>>["db"];
  let dbClient: Awaited<ReturnType<typeof setupDB>>["dbClient"];
  let server: FastifyInstance;
  let userId: string;
  let png: Buffer;
  beforeAll(async () => {
    png = await sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } }).png().toBuffer();
    container = await new PostgreSqlContainer("postgres:17").start();
    const setup = await setupDB(container.getConnectionUri(), { migrating: true });
    await migrate(setup.db, { migrationsFolder });
    await teardownDB(setup.dbClient);
  });
  beforeEach(async () => {
    getSessionMock.mockReset();
    s3SendMock.mockReset().mockResolvedValue({});
    ({ db, dbClient } = await setupDB(container.getConnectionUri()));
    await db.delete(fileUploads);
    await db.delete(users);
    userId = randomUUID();
    await db.insert(users).values({ id: userId, name: "User", email: `${userId}@example.test`, role: "user" });
    getSessionMock.mockResolvedValue({ user: { id: userId, role: "user" } });
    server = await buildServer(db);
    await server.ready();
  });
  afterEach(async () => {
    await server?.close();
    if (dbClient) await teardownDB(dbClient);
  });
  afterAll(async () => { await container?.stop(); });
  function create(overrides = {}) {
    return server.inject({ method: "POST", url: "/v1/uploads", payload: {
      name: "logo.png", byteSize: png.length, contentType: "image/png", type: "project_logo", ...overrides,
    } });
  }
  function put(id: number, payload = png, contentType = "image/png") {
    return server.inject({ method: "PUT", url: `/v1/uploads/${id}/content`, headers: { "content-type": contentType }, payload });
  }
  it("requires authentication before allocating or reading uploads", async () => {
    getSessionMock.mockResolvedValue(null);
    expect((await create()).statusCode).toBe(401);
    expect((await put(1)).statusCode).toBe(401);
    expect(await db.query.fileUploads.findMany()).toHaveLength(0);
    expect(s3SendMock).not.toHaveBeenCalled();
  });
  it("allocates an API upload URL and strips filename directories", async () => {
    const response = await create({ name: "../../etc/logo.png" });
    expect(response.statusCode).toBe(201);
    const data = response.json().data;
    expect(data.uploadUrl).toBe(`http://localhost:3001/v1/uploads/${data.uploadId}/content`);
    expect(data.fileKey).toMatch(/^project_logo\/[\w-]+-logo\.png$/);
    expect((await db.query.fileUploads.findFirst())?.completedAt).toBeNull();
    expect(s3SendMock).not.toHaveBeenCalled();
  });
  it("decodes and stores an image once; completion is idempotent", async () => {
    const { uploadId, fileKey } = (await create()).json().data;
    expect((await server.inject({ method: "POST", url: `/v1/uploads/${uploadId}/complete` })).statusCode).toBe(400);
    expect((await put(uploadId)).statusCode).toBe(200);
    expect(s3SendMock).toHaveBeenCalledOnce();
    const input = s3SendMock.mock.calls[0][0].input;
    expect(input.Key).toBe(fileKey);
    expect(input.ContentType).toBe("image/png");
    expect((await sharp(input.Body).metadata()).format).toBe("png");
    expect((await db.query.fileUploads.findFirst())?.completedAt).not.toBeNull();
    for (let i = 0; i < 2; i++) {
      expect((await server.inject({ method: "POST", url: `/v1/uploads/${uploadId}/complete` })).statusCode).toBe(200);
    }
    expect((await put(uploadId)).statusCode).toBe(409);
    expect(s3SendMock).toHaveBeenCalledOnce();
  });
  it("rejects concurrent replacement attempts", async () => {
    const { uploadId } = (await create()).json().data;
    const responses = await Promise.all([put(uploadId), put(uploadId)]);
    expect(responses.map(r => r.statusCode).sort()).toEqual([200, 409]);
    expect(s3SendMock).toHaveBeenCalledOnce();
  });
  it("rejects another account's content and completion requests", async () => {
    const { uploadId } = (await create()).json().data;
    getSessionMock.mockResolvedValue({ user: { id: randomUUID(), role: "user" } });
    expect((await put(uploadId)).statusCode).toBe(404);
    expect((await server.inject({ method: "POST", url: `/v1/uploads/${uploadId}/complete` })).statusCode).toBe(404);
    expect(s3SendMock).not.toHaveBeenCalled();
  });
  it("rejects mismatched sizes, MIME types, and forged image signatures before storage", async () => {
    const { uploadId } = (await create()).json().data;
    expect((await put(uploadId, png.subarray(0, 8))).statusCode).toBe(400);
    expect((await put(uploadId, png, "image/jpeg")).statusCode).toBe(400);
    const forged = Buffer.alloc(png.length);
    png.copy(forged, 0, 0, 8);
    expect((await put(uploadId, forged)).statusCode).toBe(400);
    expect(s3SendMock).not.toHaveBeenCalled();
    expect((await db.query.fileUploads.findFirst())?.completedAt).toBeNull();
  });
  it("rejects oversized bodies before storage even when the allocation claims a small size", async () => {
    const { uploadId } = (await create()).json().data;
    expect((await put(uploadId, Buffer.alloc(5 * 1024 * 1024 + 1))).statusCode).toBe(413);
    expect(s3SendMock).not.toHaveBeenCalled();
  });
  it("rejects disallowed formats and oversized allocations", async () => {
    for (const overrides of [{ byteSize: 5 * 1024 * 1024 + 1 }, { contentType: "image/svg+xml" }, { contentType: "text/html" }]) {
      expect((await create(overrides)).statusCode).toBe(400);
    }
    expect(await db.query.fileUploads.findMany()).toHaveLength(0);
  });
  it("cleans up failed storage writes and leaves the upload retryable", async () => {
    const { uploadId } = (await create()).json().data;
    s3SendMock.mockRejectedValueOnce(new Error("Storage unavailable"));
    expect((await put(uploadId)).statusCode).toBe(503);
    expect(s3SendMock.mock.calls[1][0].constructor.name).toBe("DeleteObjectCommand");
    expect((await db.query.fileUploads.findFirst())?.completedAt).toBeNull();
    expect((await put(uploadId)).statusCode).toBe(200);
  });
});
