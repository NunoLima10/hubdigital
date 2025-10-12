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

const getSessionMock = vi.fn();
const updateUserMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
      updateUser: updateUserMock,
    },
    handler: vi.fn(),
  },
}));

const migrationsFolder = join(__dirname, "../../src/db/migrations");

describe("Users module - onboarding (e2e)", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
  let connectionUri: string;

  let setupDB: typeof import("@/db").setupDB;
  let teardownDB: typeof import("@/db").teardownDB;
  let buildServer: typeof import("@/server").buildServer;
  let publishers: typeof import("@/db/schemas").publishers;
  let users: typeof import("@/db/schemas").users;

  let dbClient: Awaited<ReturnType<typeof setupDB>>["dbClient"];
  let db: Awaited<ReturnType<typeof setupDB>>["db"];
  let server: FastifyInstance;
  let currentUserId: string;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17").start();
    connectionUri = container.getConnectionUri();

    process.env.DATABASE_URL = connectionUri;

    ({ setupDB, teardownDB } = await import("@/db"));
    ({ buildServer } = await import("@/server"));
    ({ publishers, users } = await import("@/db/schemas"));

    const setupResult = await setupDB(connectionUri, { migrating: true });
    await migrate(setupResult.db, { migrationsFolder });
    await teardownDB(setupResult.dbClient);
  });

  beforeEach(async () => {
    getSessionMock.mockReset();
    updateUserMock.mockReset();

    const setupResult = await setupDB(connectionUri);
    db = setupResult.db;
    dbClient = setupResult.dbClient;

    await db.delete(publishers);
    await db.delete(users);

    currentUserId = randomUUID();
    await db.insert(users).values({
      id: currentUserId,
      name: "Test User",
      email: `test-${currentUserId}@example.com`,
      role: "user",
      onboardingComplete: false,
    });

    server = await buildServer(db);
    await server.ready();
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }

    if (dbClient) {
      await teardownDB(dbClient);
    }

    vi.clearAllMocks();
  });

  afterAll(async () => {
    if (container) {
      await container.stop();
    }
  });

  it("rejects onboarding when the user is unauthenticated", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await server.inject({
      method: "POST",
      url: "/v1/users/onboarding",
      payload: {
        bio: "Test Bio",
        profileResponse: "student",
        objectiveResponse: "discover-products",
        locationResponse: "CV1",
        foundUsByResponse: "social-media",
      },
    });

    expect(response.statusCode).toBe(401);
    const body = response.json();
    expect(body.error).toBeDefined();

    const publishersRecords = await db.query.publishers.findMany();
    expect(publishersRecords).toHaveLength(0);
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("creates a publisher record and marks onboarding as complete", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: currentUserId, role: "user" },
    });
    updateUserMock.mockResolvedValue({});

    const payload = {
      bio: "Excited to join Hub Digital",
      profileResponse: "student",
      objectiveResponse: "discover-products",
      locationResponse: "CV1",
      foundUsByResponse: "social-media",
    } as const;

    const response = await server.inject({
      method: "POST",
      url: "/v1/users/onboarding",
      payload,
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.data).toEqual({
      id: expect.any(Number),
    });

    const publisher = await db.query.publishers.findFirst({
      where: (table, { eq: equals }) => equals(table.userId, currentUserId),
    });

    expect(publisher).toMatchObject({
      userId: currentUserId,
      bio: payload.bio,
      profileResponse: payload.profileResponse,
      objectiveResponse: payload.objectiveResponse,
      locationResponse: payload.locationResponse,
      foundUsByResponse: payload.foundUsByResponse,
    });

    expect(updateUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          onboardingComplete: true,
        }),
      })
    );
  });

  it("returns a validation error when the payload is invalid", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: currentUserId, role: "user" },
    });

    const response = await server.inject({
      method: "POST",
      url: "/v1/users/onboarding",
      payload: {
        bio: "Test Bio",
        profileResponse: "invalid-profile",
        objectiveResponse: "discover-products",
        locationResponse: "CV1",
        foundUsByResponse: "social-media",
      },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBeDefined();
    expect(updateUserMock).not.toHaveBeenCalled();
  });
});
