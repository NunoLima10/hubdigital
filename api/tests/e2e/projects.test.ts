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
import { categories, projects, publishers, users } from "@/db/schemas";
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

const validProjectPayload = {
  name: "Hub Digital",
  shortDescription: "Uma plataforma para descobrir projetos digitais de CV",
  websiteUrl: "https://hubdigital.cv",
  pricing: "free",
  platform: ["web"],
  businessModel: "b2c",
  access: "public_beta",
  projectStage: "mvp",
  audienceStage: "general_public",
} as const;

describe("Projects module (e2e)", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
  let connectionUri: string;

  let dbClient: Awaited<ReturnType<typeof setupDB>>["dbClient"];
  let db: Awaited<ReturnType<typeof setupDB>>["db"];
  let server: FastifyInstance;
  let currentUserId: string;
  let categoryId: number;

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

    await db.delete(projects);
    await db.delete(publishers);
    await db.delete(users);
    await db.delete(categories);

    currentUserId = randomUUID();
    await db.insert(users).values({
      id: currentUserId,
      name: "Test User",
      email: `test-${currentUserId}@example.com`,
      role: "user",
    });

    const [category] = await db
      .insert(categories)
      .values({ key: "ai", name: "Inteligência Artificial" })
      .returning({ id: categories.id });
    categoryId = category.id;

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

  describe("POST /v1/projects", () => {
    it("rejects project creation when the user is unauthenticated", async () => {
      getSessionMock.mockResolvedValue(null);

      const response = await server.inject({
        method: "POST",
        url: "/v1/projects",
        payload: { ...validProjectPayload, categoryId },
      });

      expect(response.statusCode).toBe(401);

      const projectRecords = await db.query.projects.findMany();
      expect(projectRecords).toHaveLength(0);
    });

    it("rejects project creation when the user has no publisher profile", async () => {
      getSessionMock.mockResolvedValue({
        user: { id: currentUserId, role: "user" },
      });

      const response = await server.inject({
        method: "POST",
        url: "/v1/projects",
        payload: { ...validProjectPayload, categoryId },
      });

      expect(response.statusCode).toBe(403);

      const projectRecords = await db.query.projects.findMany();
      expect(projectRecords).toHaveLength(0);
    });

    it("creates a project for an onboarded user and returns its slug", async () => {
      const [publisher] = await db
        .insert(publishers)
        .values({
          userId: currentUserId,
          bio: "Building things",
          profileResponse: "founder",
          objectiveResponse: "launch-product",
          locationResponse: "CV1",
          foundUsByResponse: "social-media",
        })
        .returning({ id: publishers.id });

      getSessionMock.mockResolvedValue({
        user: { id: currentUserId, role: "user" },
      });

      const response = await server.inject({
        method: "POST",
        url: "/v1/projects",
        payload: { ...validProjectPayload, categoryId },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.data.id).toEqual(expect.any(Number));
      expect(body.data.slug).toBe("hub-digital");

      const project = await db.query.projects.findFirst({
        where: eq(projects.id, body.data.id),
      });

      expect(project).toMatchObject({
        publisherId: publisher.id,
        name: validProjectPayload.name,
        slug: "hub-digital",
        categoryId,
      });
    });

    it("generates a unique slug when the name is already taken", async () => {
      await db.insert(publishers).values({
        userId: currentUserId,
        bio: "Building things",
        profileResponse: "founder",
        objectiveResponse: "launch-product",
        locationResponse: "CV1",
        foundUsByResponse: "social-media",
      });

      getSessionMock.mockResolvedValue({
        user: { id: currentUserId, role: "user" },
      });

      const first = await server.inject({
        method: "POST",
        url: "/v1/projects",
        payload: { ...validProjectPayload, categoryId },
      });
      expect(first.statusCode).toBe(201);
      expect(first.json().data.slug).toBe("hub-digital");

      const second = await server.inject({
        method: "POST",
        url: "/v1/projects",
        payload: { ...validProjectPayload, categoryId },
      });
      expect(second.statusCode).toBe(201);
      expect(second.json().data.slug).not.toBe("hub-digital");
      expect(second.json().data.slug).toMatch(/^hub-digital-/);
    });

    it("returns a validation error when the payload is invalid", async () => {
      getSessionMock.mockResolvedValue({
        user: { id: currentUserId, role: "user" },
      });

      const response = await server.inject({
        method: "POST",
        url: "/v1/projects",
        payload: { ...validProjectPayload, categoryId, pricing: "invalid" },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /v1/projects/mine", () => {
    it("rejects the request when the user is unauthenticated", async () => {
      getSessionMock.mockResolvedValue(null);

      const response = await server.inject({
        method: "GET",
        url: "/v1/projects/mine",
      });

      expect(response.statusCode).toBe(401);
    });

    it("returns only the projects created by the current user's publisher", async () => {
      const otherUserId = randomUUID();
      await db.insert(users).values({
        id: otherUserId,
        name: "Other User",
        email: `other-${otherUserId}@example.com`,
        role: "user",
      });

      const [myPublisher] = await db
        .insert(publishers)
        .values({
          userId: currentUserId,
          bio: "Building things",
          profileResponse: "founder",
          objectiveResponse: "launch-product",
          locationResponse: "CV1",
          foundUsByResponse: "social-media",
        })
        .returning({ id: publishers.id });

      const [otherPublisher] = await db
        .insert(publishers)
        .values({
          userId: otherUserId,
          bio: "Building other things",
          profileResponse: "founder",
          objectiveResponse: "launch-product",
          locationResponse: "CV2",
          foundUsByResponse: "friends",
        })
        .returning({ id: publishers.id });

      await db.insert(projects).values([
        {
          publisherId: myPublisher.id,
          categoryId,
          slug: "meu-projeto",
          name: "Meu Projeto",
          shortDescription: validProjectPayload.shortDescription,
          websiteUrl: validProjectPayload.websiteUrl,
          pricing: "free",
          platform: ["web"],
          businessModel: "b2c",
          access: "public_beta",
          projectStage: "mvp",
          audienceStage: "general_public",
        },
        {
          publisherId: otherPublisher.id,
          categoryId,
          slug: "projeto-alheio",
          name: "Projeto Alheio",
          shortDescription: validProjectPayload.shortDescription,
          websiteUrl: validProjectPayload.websiteUrl,
          pricing: "free",
          platform: ["web"],
          businessModel: "b2c",
          access: "public_beta",
          projectStage: "mvp",
          audienceStage: "general_public",
        },
      ]);

      getSessionMock.mockResolvedValue({
        user: { id: currentUserId, role: "user" },
      });

      const response = await server.inject({
        method: "GET",
        url: "/v1/projects/mine",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toMatchObject({
        slug: "meu-projeto",
        name: "Meu Projeto",
      });
      expect(body.meta.total).toBe(1);
    });

    it("returns 403 when the user has no publisher profile yet", async () => {
      getSessionMock.mockResolvedValue({
        user: { id: currentUserId, role: "user" },
      });

      const response = await server.inject({
        method: "GET",
        url: "/v1/projects/mine",
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe("PATCH /v1/projects/:id", () => {
    it("rejects the request when the user is unauthenticated", async () => {
      getSessionMock.mockResolvedValue(null);

      const response = await server.inject({
        method: "PATCH",
        url: "/v1/projects/1",
        payload: { name: "New Name" },
      });

      expect(response.statusCode).toBe(401);
    });

    it("updates a project owned by the current user's publisher", async () => {
      const [publisher] = await db
        .insert(publishers)
        .values({
          userId: currentUserId,
          bio: "Building things",
          profileResponse: "founder",
          objectiveResponse: "launch-product",
          locationResponse: "CV1",
          foundUsByResponse: "social-media",
        })
        .returning({ id: publishers.id });

      const [project] = await db
        .insert(projects)
        .values({
          publisherId: publisher.id,
          categoryId,
          slug: "meu-projeto",
          name: "Meu Projeto",
          shortDescription: validProjectPayload.shortDescription,
          websiteUrl: validProjectPayload.websiteUrl,
          pricing: "free",
          platform: ["web"],
          businessModel: "b2c",
          access: "public_beta",
          projectStage: "mvp",
          audienceStage: "general_public",
        })
        .returning({ id: projects.id });

      getSessionMock.mockResolvedValue({
        user: { id: currentUserId, role: "user" },
      });

      const response = await server.inject({
        method: "PATCH",
        url: `/v1/projects/${project.id}`,
        payload: {
          name: "Meu Projeto Atualizado",
          pricing: "paid",
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.slug).toBe("meu-projeto");

      const updated = await db.query.projects.findFirst({
        where: eq(projects.id, project.id),
      });

      expect(updated).toMatchObject({
        name: "Meu Projeto Atualizado",
        pricing: "paid",
        slug: "meu-projeto",
      });
    });

    it("returns 404 when the project does not belong to the current user's publisher", async () => {
      await db.insert(publishers).values({
        userId: currentUserId,
        bio: "Building things",
        profileResponse: "founder",
        objectiveResponse: "launch-product",
        locationResponse: "CV1",
        foundUsByResponse: "social-media",
      });

      const otherUserId = randomUUID();
      await db.insert(users).values({
        id: otherUserId,
        name: "Other User",
        email: `other-${otherUserId}@example.com`,
        role: "user",
      });

      const [otherPublisher] = await db
        .insert(publishers)
        .values({
          userId: otherUserId,
          bio: "Building other things",
          profileResponse: "founder",
          objectiveResponse: "launch-product",
          locationResponse: "CV2",
          foundUsByResponse: "friends",
        })
        .returning({ id: publishers.id });

      const [otherProject] = await db
        .insert(projects)
        .values({
          publisherId: otherPublisher.id,
          categoryId,
          slug: "projeto-alheio",
          name: "Projeto Alheio",
          shortDescription: validProjectPayload.shortDescription,
          websiteUrl: validProjectPayload.websiteUrl,
          pricing: "free",
          platform: ["web"],
          businessModel: "b2c",
          access: "public_beta",
          projectStage: "mvp",
          audienceStage: "general_public",
        })
        .returning({ id: projects.id });

      getSessionMock.mockResolvedValue({
        user: { id: currentUserId, role: "user" },
      });

      const response = await server.inject({
        method: "PATCH",
        url: `/v1/projects/${otherProject.id}`,
        payload: { name: "Hijacked" },
      });

      expect(response.statusCode).toBe(404);

      const untouched = await db.query.projects.findFirst({
        where: eq(projects.id, otherProject.id),
      });
      expect(untouched?.name).toBe("Projeto Alheio");
    });

    it("returns 403 when the user has no publisher profile yet", async () => {
      getSessionMock.mockResolvedValue({
        user: { id: currentUserId, role: "user" },
      });

      const response = await server.inject({
        method: "PATCH",
        url: "/v1/projects/1",
        payload: { name: "New Name" },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe("GET /v1/projects", () => {
    it("returns projects from all publishers without requiring authentication", async () => {
      const otherUserId = randomUUID();
      await db.insert(users).values({
        id: otherUserId,
        name: "Other User",
        email: `other-${otherUserId}@example.com`,
        role: "user",
      });

      const [myPublisher] = await db
        .insert(publishers)
        .values({
          userId: currentUserId,
          bio: "Building things",
          profileResponse: "founder",
          objectiveResponse: "launch-product",
          locationResponse: "CV1",
          foundUsByResponse: "social-media",
        })
        .returning({ id: publishers.id });

      const [otherPublisher] = await db
        .insert(publishers)
        .values({
          userId: otherUserId,
          bio: "Building other things",
          profileResponse: "founder",
          objectiveResponse: "launch-product",
          locationResponse: "CV2",
          foundUsByResponse: "friends",
        })
        .returning({ id: publishers.id });

      await db.insert(projects).values([
        {
          publisherId: myPublisher.id,
          categoryId,
          slug: "meu-projeto",
          name: "Meu Projeto",
          shortDescription: validProjectPayload.shortDescription,
          websiteUrl: validProjectPayload.websiteUrl,
          pricing: "free",
          platform: ["web"],
          businessModel: "b2c",
          access: "public_beta",
          projectStage: "mvp",
          audienceStage: "general_public",
        },
        {
          publisherId: otherPublisher.id,
          categoryId,
          slug: "projeto-alheio",
          name: "Projeto Alheio",
          shortDescription: validProjectPayload.shortDescription,
          websiteUrl: validProjectPayload.websiteUrl,
          pricing: "free",
          platform: ["web"],
          businessModel: "b2c",
          access: "public_beta",
          projectStage: "mvp",
          audienceStage: "general_public",
        },
      ]);

      getSessionMock.mockResolvedValue(null);

      const response = await server.inject({
        method: "GET",
        url: "/v1/projects",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toHaveLength(2);
      expect(body.meta.total).toBe(2);
      expect(body.data.map((p: { slug: string }) => p.slug).sort()).toEqual([
        "meu-projeto",
        "projeto-alheio",
      ]);
      expect(body.data[0].category).toMatchObject({ id: categoryId });
    });

    it("returns an empty list when there are no projects", async () => {
      getSessionMock.mockResolvedValue(null);

      const response = await server.inject({
        method: "GET",
        url: "/v1/projects",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toEqual([]);
      expect(body.meta.total).toBe(0);
    });
  });

  describe("POST /v1/projects/:id/upvote", () => {
    async function insertProject() {
      const [publisher] = await db
        .insert(publishers)
        .values({
          userId: currentUserId,
          bio: "Building things",
          profileResponse: "founder",
          objectiveResponse: "launch-product",
          locationResponse: "CV1",
          foundUsByResponse: "social-media",
        })
        .returning({ id: publishers.id });

      const [project] = await db
        .insert(projects)
        .values({
          publisherId: publisher.id,
          categoryId,
          slug: "meu-projeto",
          name: "Meu Projeto",
          shortDescription: validProjectPayload.shortDescription,
          websiteUrl: validProjectPayload.websiteUrl,
          pricing: "free",
          platform: ["web"],
          businessModel: "b2c",
          access: "public_beta",
          projectStage: "mvp",
          audienceStage: "general_public",
        })
        .returning({ id: projects.id });

      return project;
    }

    it("rejects the request when the user is unauthenticated", async () => {
      const project = await insertProject();
      getSessionMock.mockResolvedValue(null);

      const response = await server.inject({
        method: "POST",
        url: `/v1/projects/${project.id}/upvote`,
      });

      expect(response.statusCode).toBe(401);
    });

    it("returns 404 when the project does not exist", async () => {
      getSessionMock.mockResolvedValue({
        user: { id: currentUserId, role: "user" },
      });

      const response = await server.inject({
        method: "POST",
        url: "/v1/projects/999999/upvote",
      });

      expect(response.statusCode).toBe(404);
    });

    it("adds an upvote for the current user on first call", async () => {
      const project = await insertProject();
      getSessionMock.mockResolvedValue({
        user: { id: currentUserId, role: "user" },
      });

      const response = await server.inject({
        method: "POST",
        url: `/v1/projects/${project.id}/upvote`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data).toEqual({
        upvoted: true,
        upvoteCount: 1,
      });
    });

    it("removes the upvote when called again by the same user", async () => {
      const project = await insertProject();
      getSessionMock.mockResolvedValue({
        user: { id: currentUserId, role: "user" },
      });

      await server.inject({
        method: "POST",
        url: `/v1/projects/${project.id}/upvote`,
      });

      const response = await server.inject({
        method: "POST",
        url: `/v1/projects/${project.id}/upvote`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data).toEqual({
        upvoted: false,
        upvoteCount: 0,
      });
    });

    it("reflects the vote on the project detail endpoint", async () => {
      const project = await insertProject();
      getSessionMock.mockResolvedValue({
        user: { id: currentUserId, role: "user" },
      });

      await server.inject({
        method: "POST",
        url: `/v1/projects/${project.id}/upvote`,
      });

      const response = await server.inject({
        method: "GET",
        url: "/v1/projects/meu-projeto",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.upvoteCount).toBe(1);
      expect(body.data.hasUpvoted).toBe(true);
    });
  });
});
