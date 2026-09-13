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
import {
  categories,
  projectUpvotes,
  projects,
  publishers,
  users,
} from "@/db/schemas";
import { buildServer } from "@/server";
import { eq } from "drizzle-orm";

const { getSessionMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
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

const migrationsFolder = join(__dirname, "../../src/db/migrations");

describe("Makers module (e2e)", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
  let connectionUri: string;

  let dbClient: Awaited<ReturnType<typeof setupDB>>["dbClient"];
  let db: Awaited<ReturnType<typeof setupDB>>["db"];
  let server: FastifyInstance;
  let currentUserId: string;
  let categoryId: number;
  let publisherId: number;

  function signedInAs(userId: string) {
    getSessionMock.mockResolvedValue({ user: { id: userId, role: "user" } });
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

    await db.delete(projectUpvotes);
    await db.delete(projects);
    await db.delete(publishers);
    await db.delete(users);
    await db.delete(categories);

    currentUserId = randomUUID();
    await db.insert(users).values({
      id: currentUserId,
      name: "Ana Furtado",
      email: "ana-" + currentUserId + "@example.com",
      role: "user",
    });

    const [category] = await db
      .insert(categories)
      .values({ key: "ai", name: "Inteligencia Artificial" })
      .returning({ id: categories.id });
    categoryId = category.id;

    const [publisher] = await db
      .insert(publishers)
      .values({
        userId: currentUserId,
        handle: "ana-furtado",
        bio: "A construir coisas em Cabo Verde",
        profileResponse: "founder",
        objectiveResponse: "launch-product",
        locationResponse: "CV2",
        foundUsByResponse: "social-media",
      })
      .returning({ id: publishers.id });
    publisherId = publisher.id;

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

  function projectRow(overrides: Record<string, unknown> = {}) {
    return {
      publisherId,
      categoryId,
      slug: "meu-projeto",
      name: "Meu Projeto",
      shortDescription: "Uma plataforma para descobrir projetos digitais",
      websiteUrl: "https://hubdigital.cv",
      pricing: "free" as const,
      platform: ["web" as const],
      businessModel: "b2c" as const,
      access: "public_beta" as const,
      projectStage: "mvp" as const,
      audienceStage: "general_public" as const,
      island: "sao_vicente" as const,
      status: "published" as const,
      launchedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  it("returns a public profile with its published projects", async () => {
    await db.insert(projects).values([
      projectRow(),
      projectRow({ slug: "rascunho", name: "Rascunho", status: "draft" }),
    ]);

    const response = await server.inject({
      method: "GET",
      url: "/v1/makers/ana-furtado",
    });

    expect(response.statusCode).toBe(200);

    const profile = response.json().data;
    expect(profile).toMatchObject({
      handle: "ana-furtado",
      name: "Ana Furtado",
      bio: "A construir coisas em Cabo Verde",
      projectCount: 1,
    });
    // Drafts belong to the maker, not to the public profile.
    expect(profile.projects).toHaveLength(1);
    expect(profile.projects[0].slug).toBe("meu-projeto");
  });

  it("sums upvotes across the maker's projects", async () => {
    const inserted = await db
      .insert(projects)
      .values([
        projectRow(),
        projectRow({ slug: "outro-projeto", name: "Outro Projeto" }),
      ])
      .returning({ id: projects.id });

    const voterId = randomUUID();
    await db.insert(users).values({
      id: voterId,
      name: "Voter",
      email: "voter-" + voterId + "@example.com",
      role: "user",
    });

    await db.insert(projectUpvotes).values([
      { projectId: inserted[0].id, userId: voterId },
      { projectId: inserted[1].id, userId: voterId },
    ]);

    const response = await server.inject({
      method: "GET",
      url: "/v1/makers/ana-furtado",
    });

    expect(response.json().data.totalUpvotes).toBe(2);
  });

  it("is case insensitive on the handle and 404s on an unknown one", async () => {
    const upper = await server.inject({
      method: "GET",
      url: "/v1/makers/ANA-FURTADO",
    });
    expect(upper.statusCode).toBe(200);

    const missing = await server.inject({
      method: "GET",
      url: "/v1/makers/ninguem",
    });
    expect(missing.statusCode).toBe(404);
  });

  it("exposes the author handle on the project detail", async () => {
    await db.insert(projects).values(projectRow());

    const response = await server.inject({
      method: "GET",
      url: "/v1/projects/meu-projeto",
    });

    expect(response.json().data.author).toMatchObject({
      name: "Ana Furtado",
      handle: "ana-furtado",
    });
  });

  it("updates the profile of the signed-in maker", async () => {
    signedInAs(currentUserId);

    const response = await server.inject({
      method: "PATCH",
      url: "/v1/makers/me",
      payload: {
        handle: "ana",
        bio: "Product e engenharia",
        githubUrl: "https://github.com/ana",
        websiteUrl: "",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.handle).toBe("ana");

    const record = await db.query.publishers.findFirst({
      where: eq(publishers.id, publisherId),
    });
    expect(record).toMatchObject({
      handle: "ana",
      bio: "Product e engenharia",
      githubUrl: "https://github.com/ana",
      // An emptied field clears the link rather than storing "".
      websiteUrl: null,
    });
  });

  it("rejects a handle that is already taken", async () => {
    const otherUserId = randomUUID();
    await db.insert(users).values({
      id: otherUserId,
      name: "Bruno",
      email: "bruno-" + otherUserId + "@example.com",
      role: "user",
    });
    await db.insert(publishers).values({
      userId: otherUserId,
      handle: "bruno",
      bio: "Outro maker",
      profileResponse: "founder",
      objectiveResponse: "launch-product",
      locationResponse: "CV1",
      foundUsByResponse: "social-media",
    });

    signedInAs(currentUserId);

    const response = await server.inject({
      method: "PATCH",
      url: "/v1/makers/me",
      payload: { handle: "bruno" },
    });

    expect(response.statusCode).toBe(409);

    const record = await db.query.publishers.findFirst({
      where: eq(publishers.id, publisherId),
    });
    expect(record?.handle).toBe("ana-furtado");
  });

  it("rejects a handle with invalid characters", async () => {
    signedInAs(currentUserId);

    const response = await server.inject({
      method: "PATCH",
      url: "/v1/makers/me",
      payload: { handle: "nao valido!" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("gives a handle to a publisher created through onboarding", async () => {
    const newUserId = randomUUID();
    await db.insert(users).values({
      id: newUserId,
      name: "Djô Silva",
      email: "djo-" + newUserId + "@example.com",
      role: "user",
    });

    signedInAs(newUserId);

    const response = await server.inject({
      method: "POST",
      url: "/v1/users/onboarding",
      payload: {
        bio: "Maker do Mindelo",
        profileResponse: "founder",
        objectiveResponse: "launch-product",
        locationResponse: "CV2",
        foundUsByResponse: "friends",
      },
    });

    expect(response.statusCode).toBe(201);

    const created = await db.query.publishers.findFirst({
      where: eq(publishers.userId, newUserId),
    });

    expect(created?.handle).toBeTruthy();
    expect(created?.handle).toMatch(/^[a-z0-9-]+$/);
  });

  it("requires authentication to read your own handle", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await server.inject({
      method: "GET",
      url: "/v1/makers/me",
    });

    expect(response.statusCode).toBe(401);
  });
});
