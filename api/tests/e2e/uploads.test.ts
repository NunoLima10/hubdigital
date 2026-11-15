import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import type { FastifyInstance } from "fastify";
import sharp from "sharp";
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
import { setupDB, teardownDB } from "../../src/db";
import { fileUploads, users } from "@/db/schemas";
import { buildServer } from "@/server";

const { getSessionMock, getSignedUrlMock, s3SendMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  getSignedUrlMock: vi.fn(),
  s3SendMock: vi.fn(),
}));

vi.mock("@aws-sdk/client-s3", async (original) => ({
  ...(await original<typeof import("@aws-sdk/client-s3")>()),
  S3Client: class {
    send = s3SendMock;
    destroy() {}
  },
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: getSignedUrlMock,
}));

vi.mock("../../src/lib/auth", () => ({
  auth: {
    api: { getSession: getSessionMock, updateUser: vi.fn() },
    handler: vi.fn(),
  },
}));

const migrationsFolder = join(__dirname, "../../src/db/migrations");

describe("direct verified uploads (e2e)", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
  let db: Awaited<ReturnType<typeof setupDB>>["db"];
  let dbClient: Awaited<ReturnType<typeof setupDB>>["dbClient"];
  let server: FastifyInstance;
  let userId: string;
  let png: Buffer;

  beforeAll(async () => {
    png = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 3,
        background: "red",
      },
    })
      .png()
      .toBuffer();
    container = await new PostgreSqlContainer("postgres:17").start();
    const setup = await setupDB(container.getConnectionUri(), {
      migrating: true,
    });
    await migrate(setup.db, { migrationsFolder });
    await teardownDB(setup.dbClient);
  });

  beforeEach(async () => {
    getSessionMock.mockReset();
    getSignedUrlMock.mockReset().mockResolvedValue("https://r2.test/signed-put");
    s3SendMock.mockReset().mockImplementation(async (command) => {
      if (command.constructor.name === "HeadObjectCommand") {
        return { ContentLength: png.length, ContentType: "image/png" };
      }
      if (command.constructor.name === "GetObjectCommand") {
        return {
          Body: {
            transformToByteArray: async () => new Uint8Array(png),
          },
        };
      }
      return {};
    });

    ({ db, dbClient } = await setupDB(container.getConnectionUri()));
    await db.delete(fileUploads);
    await db.delete(users);
    userId = randomUUID();
    await db.insert(users).values({
      id: userId,
      name: "User",
      email: `${userId}@example.test`,
      role: "user",
    });
    getSessionMock.mockResolvedValue({
      user: { id: userId, role: "user" },
    });
    server = await buildServer(db);
    await server.ready();
  });

  afterEach(async () => {
    await server?.close();
    if (dbClient) await teardownDB(dbClient);
  });

  afterAll(async () => {
    await container?.stop();
  });

  function create(overrides = {}) {
    return server.inject({
      method: "POST",
      url: "/v1/uploads",
      payload: {
        name: "logo.png",
        byteSize: png.length,
        contentType: "image/png",
        type: "project_logo",
        ...overrides,
      },
    });
  }

  function complete(uploadId: number) {
    return server.inject({
      method: "POST",
      url: `/v1/uploads/${uploadId}/complete`,
    });
  }

  it("requires authentication before allocating or completing uploads", async () => {
    getSessionMock.mockResolvedValue(null);

    expect((await create()).statusCode).toBe(401);
    expect((await complete(1)).statusCode).toBe(401);
    expect(await db.query.fileUploads.findMany()).toHaveLength(0);
    expect(getSignedUrlMock).not.toHaveBeenCalled();
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("returns a direct presigned staging URL and records the final key", async () => {
    const response = await create({ name: "../../etc/logo.png" });

    expect(response.statusCode).toBe(201);
    const data = response.json().data;
    expect(data.uploadUrl).toBe("https://r2.test/signed-put");
    expect(data.fileKey).toMatch(/^project_logo\/[\w-]+-logo\.png$/);
    expect(getSignedUrlMock).toHaveBeenCalledOnce();
    const signedCommand = getSignedUrlMock.mock.calls[0][1];
    expect(signedCommand.input).toMatchObject({
      Key: `unverified/${data.uploadId}`,
      ContentType: "image/png",
    });
    expect(signedCommand.input.Key).not.toBe(data.fileKey);
    expect((await db.query.fileUploads.findFirst())?.completedAt).toBeNull();
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("verifies, sanitizes, and promotes the staged image", async () => {
    const { uploadId, fileKey } = (await create()).json().data;

    const response = await complete(uploadId);

    expect(response.statusCode).toBe(200);
    expect(response.json().data.fileKey).toBe(fileKey);
    const commands = s3SendMock.mock.calls.map(([command]) => command);
    expect(commands.map((command) => command.constructor.name)).toEqual([
      "HeadObjectCommand",
      "GetObjectCommand",
      "PutObjectCommand",
      "DeleteObjectCommand",
    ]);
    expect(commands[0].input.Key).toBe(`unverified/${uploadId}`);
    expect(commands[1].input.Key).toBe(`unverified/${uploadId}`);
    expect(commands[2].input.Key).toBe(fileKey);
    expect(commands[2].input.ContentType).toBe("image/png");
    expect((await sharp(commands[2].input.Body).metadata()).format).toBe("png");
    expect(commands[3].input.Key).toBe(`unverified/${uploadId}`);
    expect((await db.query.fileUploads.findFirst())?.completedAt).not.toBeNull();

    s3SendMock.mockClear();
    expect((await complete(uploadId)).statusCode).toBe(200);
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("reports an upload that has not reached R2 yet", async () => {
    const { uploadId } = (await create()).json().data;
    s3SendMock.mockRejectedValueOnce({
      name: "NotFound",
      $metadata: { httpStatusCode: 404 },
    });

    expect((await complete(uploadId)).statusCode).toBe(400);
    expect((await db.query.fileUploads.findFirst())?.completedAt).toBeNull();
  });

  it("rejects another account's completion request", async () => {
    const { uploadId } = (await create()).json().data;
    getSessionMock.mockResolvedValue({
      user: { id: randomUUID(), role: "user" },
    });

    expect((await complete(uploadId)).statusCode).toBe(404);
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("rejects mismatched metadata and forged image bytes", async () => {
    const first = (await create()).json().data;
    s3SendMock.mockResolvedValueOnce({
      ContentLength: png.length - 1,
      ContentType: "image/png",
    });
    expect((await complete(first.uploadId)).statusCode).toBe(400);

    const second = (await create()).json().data;
    const forged = Buffer.alloc(png.length);
    png.copy(forged, 0, 0, 8);
    s3SendMock.mockImplementation(async (command) => {
      if (command.constructor.name === "HeadObjectCommand") {
        return { ContentLength: png.length, ContentType: "image/png" };
      }
      if (command.constructor.name === "GetObjectCommand") {
        return {
          Body: {
            transformToByteArray: async () => new Uint8Array(forged),
          },
        };
      }
      return {};
    });
    expect((await complete(second.uploadId)).statusCode).toBe(400);

    const finalWrites = s3SendMock.mock.calls
      .map(([command]) => command)
      .filter(
        (command) =>
          command.constructor.name === "PutObjectCommand" &&
          !command.input.Key.startsWith("unverified/")
      );
    expect(finalWrites).toHaveLength(0);
  });

  it("rejects disallowed formats and oversized allocations", async () => {
    for (const overrides of [
      { byteSize: 5 * 1024 * 1024 + 1 },
      { contentType: "image/svg+xml" },
      { contentType: "text/html" },
    ]) {
      expect((await create(overrides)).statusCode).toBe(400);
    }
    expect(await db.query.fileUploads.findMany()).toHaveLength(0);
    expect(getSignedUrlMock).not.toHaveBeenCalled();
  });

  it("cleans up a failed final write and leaves completion retryable", async () => {
    const { uploadId, fileKey } = (await create()).json().data;
    let failFinalWrite = true;
    s3SendMock.mockImplementation(async (command) => {
      if (command.constructor.name === "HeadObjectCommand") {
        return { ContentLength: png.length, ContentType: "image/png" };
      }
      if (command.constructor.name === "GetObjectCommand") {
        return {
          Body: {
            transformToByteArray: async () => new Uint8Array(png),
          },
        };
      }
      if (
        command.constructor.name === "PutObjectCommand" &&
        command.input.Key === fileKey &&
        failFinalWrite
      ) {
        failFinalWrite = false;
        throw new Error("Storage unavailable");
      }
      return {};
    });

    expect((await complete(uploadId)).statusCode).toBe(503);
    expect((await db.query.fileUploads.findFirst())?.completedAt).toBeNull();
    expect(
      s3SendMock.mock.calls.some(
        ([command]) =>
          command.constructor.name === "DeleteObjectCommand" &&
          command.input.Key === fileKey
      )
    ).toBe(true);
    expect((await complete(uploadId)).statusCode).toBe(200);
  });
});
