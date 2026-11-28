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
import { publishers, users } from "@/db/schemas";
import { buildServer } from "@/server";
import { eq } from "drizzle-orm";

const { getSessionMock, updateUserMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  updateUserMock: vi.fn(),
}));

vi.mock("../../src/lib/auth", () => ({
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
        profileResponses: ["student"],
        objectiveResponses: ["discover-products"],
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
      // Several profiles can be picked at once.
      profileResponses: ["student", "founder"],
      objectiveResponses: ["discover-products", "networking"],
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
    // The first member earns no automatic badge: the founder one is granted.
    expect(body.data).toEqual({
      id: expect.any(Number),
      membershipNumber: expect.any(Number),
      badges: [],
    });

    const publisher = await db.query.publishers.findFirst({
      where: eq(publishers.userId, currentUserId),
    });

    expect(publisher).toMatchObject({
      userId: currentUserId,
      bio: payload.bio,
      profileResponses: ["student", "founder"],
      objectiveResponses: ["discover-products", "networking"],
      locationResponse: payload.locationResponse,
      foundUsByResponse: payload.foundUsByResponse,
    });

    expect(updateUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          onboardedAt: expect.any(Date),
        }),
      })
    );
  });

  it.each([
    ["an unknown profile", ["invalid-profile"]],
    ["no profile", []],
    ["a repeated profile", ["student", "student"]],
    ["a single profile instead of a list", "student"],
  ])("returns a validation error for %s", async (_case, profileResponses) => {
    getSessionMock.mockResolvedValue({
      user: { id: currentUserId, role: "user" },
    });

    const response = await server.inject({
      method: "POST",
      url: "/v1/users/onboarding",
      payload: {
        bio: "Test Bio",
        profileResponses,
        objectiveResponses: ["discover-products"],
        locationResponse: "CV1",
        foundUsByResponse: "social-media",
      },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBeDefined();
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("accepts diaspora onboarding without an island of origin", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: currentUserId, role: "user" },
    });

    updateUserMock.mockResolvedValue({});
    const response = await server.inject({
      method: "POST",
      url: "/v1/users/onboarding",
      payload: {
        profileResponses: ["student"],
        objectiveResponses: ["discover-products"],
        locationResponse: "diaspora",
        diasporaCountry: "pt",
        foundUsByResponse: "social-media",
      },
    });

    expect(response.statusCode).toBe(201);
    const publisher = await db.query.publishers.findFirst({ where: eq(publishers.userId, currentUserId) });
    expect(publisher?.originIsland).toBeNull();
  });

  it("stores the island of origin only for the diaspora", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: currentUserId, role: "user" },
    });
    updateUserMock.mockResolvedValue({});

    const response = await server.inject({
      method: "POST",
      url: "/v1/users/onboarding",
      payload: {
        profileResponses: ["student"],
        objectiveResponses: ["discover-products"],
        locationResponse: "diaspora",
        diasporaCountry: "pt",
        originIsland: "CV7",
        foundUsByResponse: "social-media",
      },
    });

    expect(response.statusCode).toBe(201);
    const publisher = await db.query.publishers.findFirst({
      where: eq(publishers.userId, currentUserId),
    });
    expect(publisher).toMatchObject({
      locationResponse: "diaspora",
      diasporaCountry: "pt",
      originIsland: "CV7",
    });
  });

  it("ignores an island of origin sent by someone living in Cabo Verde", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: currentUserId, role: "user" },
    });
    updateUserMock.mockResolvedValue({});

    const response = await server.inject({
      method: "POST",
      url: "/v1/users/onboarding",
      payload: {
        profileResponses: ["student"],
        objectiveResponses: ["discover-products"],
        locationResponse: "CV2",
        originIsland: "CV7",
        foundUsByResponse: "social-media",
      },
    });

    expect(response.statusCode).toBe(201);
    const publisher = await db.query.publishers.findFirst({
      where: eq(publishers.userId, currentUserId),
    });
    expect(publisher?.originIsland).toBeNull();
  });

  it("returns and records the account eligibility confirmation", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: currentUserId, role: "user" },
    });

    const initialResponse = await server.inject({
      method: "GET",
      url: "/v1/users/me/eligibility-confirmation",
    });

    expect(initialResponse.statusCode).toBe(200);
    expect(initialResponse.json()).toEqual({ data: { confirmedAt: null } });

    const confirmResponse = await server.inject({
      method: "PUT",
      url: "/v1/users/me/eligibility-confirmation",
      payload: { confirmed: true },
    });

    expect(confirmResponse.statusCode).toBe(200);
    expect(confirmResponse.json().data.confirmedAt).toEqual(expect.any(String));

    const user = await db.query.users.findFirst({
      where: eq(users.id, currentUserId),
    });
    expect(user?.eligibilityConfirmedAt).toBeInstanceOf(Date);
  });

  it("rejects an invalid eligibility declaration", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: currentUserId, role: "user" },
    });

    const response = await server.inject({
      method: "PUT",
      url: "/v1/users/me/eligibility-confirmation",
      payload: { confirmed: false },
    });

    expect(response.statusCode).toBe(400);
  });

  it("does not expose eligibility status without authentication", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await server.inject({
      method: "GET",
      url: "/v1/users/me/eligibility-confirmation",
    });

    expect(response.statusCode).toBe(401);
  });
});
