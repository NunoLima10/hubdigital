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
  location: { country: "cv", island: "CV2" },
} as const;

/** A row shaped like a live project; override whatever the test cares about. */
function projectFixture(
  overrides: Partial<typeof projects.$inferInsert> &
    Pick<typeof projects.$inferInsert, "publisherId" | "categoryId" | "slug">
): typeof projects.$inferInsert {
  return {
    name: "Meu Projeto",
    shortDescription: validProjectPayload.shortDescription,
    websiteUrl: validProjectPayload.websiteUrl,
    pricing: "free",
    platform: ["web"],
    businessModel: "b2c",
    access: "public_beta",
    projectStage: "mvp",
    audienceStage: "general_public",
    country: "cv",
    island: "CV2",
    status: "published",
    launchedAt: new Date().toISOString(),
    ...overrides,
  };
}

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

    it("stores image keys and returns them as public urls", async () => {
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

      const logoKey = "project_logo/abc-123-logo.png";
      const bannerKey = "project_banner/abc-123-banner.png";

      const createResponse = await server.inject({
        method: "POST",
        url: "/v1/projects",
        payload: {
          ...validProjectPayload,
          categoryId,
          logoUrl: logoKey,
          bannerImageUrl: bannerKey,
        },
      });

      expect(createResponse.statusCode).toBe(201);
      expect(publisher).toBeDefined();

      // Stored as the raw object key...
      const [record] = await db.query.projects.findMany();
      expect(record.logoUrl).toBe(logoKey);
      expect(record.bannerImageUrl).toBe(bannerKey);

      // ...and handed out as a resolved public url.
      const detailResponse = await server.inject({
        method: "GET",
        url: `/v1/projects/${createResponse.json().data.slug}`,
      });

      expect(detailResponse.json().data.logoUrl).toBe(
        `https://assets.test.hubdigital.cv/${logoKey}`
      );
      expect(detailResponse.json().data.bannerImageUrl).toBe(
        `https://assets.test.hubdigital.cv/${bannerKey}`
      );
    });

    it("rejects an image field that is not an upload key", async () => {
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

      const response = await server.inject({
        method: "POST",
        url: "/v1/projects",
        payload: {
          ...validProjectPayload,
          categoryId,
          logoUrl: "https://evil.example.com/tracker.png",
        },
      });

      expect(response.statusCode).toBe(400);

      const projectRecords = await db.query.projects.findMany();
      expect(projectRecords).toHaveLength(0);
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
          status: "published",
          launchedAt: new Date().toISOString(),
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
          status: "published",
          launchedAt: new Date().toISOString(),
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
          status: "published",
          launchedAt: new Date().toISOString(),
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
          status: "published",
          launchedAt: new Date().toISOString(),
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
          status: "published",
          launchedAt: new Date().toISOString(),
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
          status: "published",
          launchedAt: new Date().toISOString(),
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
          status: "published",
          launchedAt: new Date().toISOString(),
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

    it("records the voter's ip and user agent for later auditing", async () => {
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
        .values(
          projectFixture({
            publisherId: publisher.id,
            categoryId,
            slug: "auditavel",
          })
        )
        .returning({ id: projects.id });

      getSessionMock.mockResolvedValue({
        user: { id: currentUserId, role: "user" },
      });

      const response = await server.inject({
        method: "POST",
        url: "/v1/projects/" + project.id + "/upvote",
        headers: { "user-agent": "HubDigitalTest/1.0" },
      });

      expect(response.statusCode).toBe(200);

      const [upvote] = await db.query.projectUpvotes.findMany();
      expect(upvote.userAgent).toBe("HubDigitalTest/1.0");
      expect(upvote.ipAddress).toBeTruthy();
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

  describe("publication lifecycle", () => {
    async function seedPublisher(userId: string) {
      const [publisher] = await db
        .insert(publishers)
        .values({
          userId,
          bio: "Building things",
          profileResponse: "founder",
          objectiveResponse: "launch-product",
          locationResponse: "CV1",
          foundUsByResponse: "social-media",
        })
        .returning({ id: publishers.id });

      return publisher;
    }

    it("creates projects as drafts that visitors cannot see", async () => {
      await seedPublisher(currentUserId);
      getSessionMock.mockResolvedValue({
        user: { id: currentUserId, role: "user" },
      });

      const created = await server.inject({
        method: "POST",
        url: "/v1/projects",
        payload: { ...validProjectPayload, categoryId },
      });

      expect(created.statusCode).toBe(201);

      const record = await db.query.projects.findFirst({
        where: eq(projects.id, created.json().data.id),
      });
      expect(record?.status).toBe("draft");
      expect(record?.launchedAt).toBeNull();

      getSessionMock.mockResolvedValue(null);
      const listed = await server.inject({
        method: "GET",
        url: "/v1/projects?period=all",
      });

      expect(listed.json().data).toHaveLength(0);
    });

    it("publishes a draft and puts it in the current week", async () => {
      const publisher = await seedPublisher(currentUserId);
      const [project] = await db
        .insert(projects)
        .values(
          projectFixture({
            publisherId: publisher.id,
            categoryId,
            slug: "meu-rascunho",
            status: "draft",
            launchedAt: null,
          })
        )
        .returning({ id: projects.id });

      getSessionMock.mockResolvedValue({
        user: { id: currentUserId, role: "user" },
      });

      const response = await server.inject({
        method: "POST",
        url: "/v1/projects/" + project.id + "/publish",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data.status).toBe("published");

      const listed = await server.inject({
        method: "GET",
        url: "/v1/projects",
      });

      expect(listed.json().data).toHaveLength(1);
      expect(listed.json().data[0].slug).toBe("meu-rascunho");
    });

    it("does not move the launch date when publishing twice", async () => {
      const publisher = await seedPublisher(currentUserId);
      const launchedAt = new Date("2026-08-25T10:00:00Z").toISOString();
      const [project] = await db
        .insert(projects)
        .values(
          projectFixture({
            publisherId: publisher.id,
            categoryId,
            slug: "ja-publicado",
            launchedAt,
          })
        )
        .returning({ id: projects.id });

      getSessionMock.mockResolvedValue({
        user: { id: currentUserId, role: "user" },
      });

      const response = await server.inject({
        method: "POST",
        url: "/v1/projects/" + project.id + "/publish",
      });

      expect(response.statusCode).toBe(200);

      const record = await db.query.projects.findFirst({
        where: eq(projects.id, project.id),
      });
      expect(new Date(record!.launchedAt!).toISOString()).toBe(launchedAt);
    });

    it("refuses to publish a project owned by someone else", async () => {
      const otherUserId = randomUUID();
      await db.insert(users).values({
        id: otherUserId,
        name: "Other User",
        email: "other-" + otherUserId + "@example.com",
        role: "user",
      });
      const otherPublisher = await seedPublisher(otherUserId);
      await seedPublisher(currentUserId);

      const [project] = await db
        .insert(projects)
        .values(
          projectFixture({
            publisherId: otherPublisher.id,
            categoryId,
            slug: "projeto-alheio",
            status: "draft",
            launchedAt: null,
          })
        )
        .returning({ id: projects.id });

      getSessionMock.mockResolvedValue({
        user: { id: currentUserId, role: "user" },
      });

      const response = await server.inject({
        method: "POST",
        url: "/v1/projects/" + project.id + "/publish",
      });

      expect(response.statusCode).toBe(404);

      const record = await db.query.projects.findFirst({
        where: eq(projects.id, project.id),
      });
      expect(record?.status).toBe("draft");
    });

    it("soft deletes a project and hides it everywhere", async () => {
      const publisher = await seedPublisher(currentUserId);
      const [project] = await db
        .insert(projects)
        .values(
          projectFixture({
            publisherId: publisher.id,
            categoryId,
            slug: "para-apagar",
          })
        )
        .returning({ id: projects.id });

      getSessionMock.mockResolvedValue({
        user: { id: currentUserId, role: "user" },
      });

      const response = await server.inject({
        method: "DELETE",
        url: "/v1/projects/" + project.id,
      });

      expect(response.statusCode).toBe(204);

      // The row survives so the slug is not reused and vote history is kept.
      const record = await db.query.projects.findFirst({
        where: eq(projects.id, project.id),
      });
      expect(record?.deletedAt).not.toBeNull();

      const mine = await server.inject({
        method: "GET",
        url: "/v1/projects/mine",
      });
      expect(mine.json().data).toHaveLength(0);

      const detail = await server.inject({
        method: "GET",
        url: "/v1/projects/para-apagar",
      });
      expect(detail.statusCode).toBe(404);
    });

    it("shows a draft to its owner but not to anyone else", async () => {
      const publisher = await seedPublisher(currentUserId);
      await db.insert(projects).values(
        projectFixture({
          publisherId: publisher.id,
          categoryId,
          slug: "rascunho-privado",
          status: "draft",
          launchedAt: null,
        })
      );

      getSessionMock.mockResolvedValue({
        user: { id: currentUserId, role: "user" },
      });
      const asOwner = await server.inject({
        method: "GET",
        url: "/v1/projects/rascunho-privado",
      });
      expect(asOwner.statusCode).toBe(200);
      expect(asOwner.json().data.status).toBe("draft");

      getSessionMock.mockResolvedValue(null);
      const asVisitor = await server.inject({
        method: "GET",
        url: "/v1/projects/rascunho-privado",
      });
      expect(asVisitor.statusCode).toBe(404);
    });
  });

  describe("weekly launch cycle", () => {
    let publisherId: number;

    beforeEach(async () => {
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

      publisherId = publisher.id;
      getSessionMock.mockResolvedValue(null);
    });

    /** Eight days back always lands in an earlier ISO week. */
    function lastWeekIso() {
      return new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    }

    it("defaults to this week and leaves earlier launches out", async () => {
      await db.insert(projects).values([
        projectFixture({ publisherId, categoryId, slug: "desta-semana" }),
        projectFixture({
          publisherId,
          categoryId,
          slug: "da-semana-passada",
          launchedAt: lastWeekIso(),
        }),
      ]);

      const response = await server.inject({
        method: "GET",
        url: "/v1/projects",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].slug).toBe("desta-semana");
      expect(body.meta.week).toMatch(/^\d{4}-W\d{2}$/);
    });

    it("returns the previous cycle for period=last_week", async () => {
      await db.insert(projects).values([
        projectFixture({ publisherId, categoryId, slug: "desta-semana" }),
        projectFixture({
          publisherId,
          categoryId,
          slug: "da-semana-passada",
          launchedAt: lastWeekIso(),
        }),
      ]);

      const response = await server.inject({
        method: "GET",
        url: "/v1/projects?period=last_week",
      });

      expect(response.json().data).toHaveLength(1);
      expect(response.json().data[0].slug).toBe("da-semana-passada");
    });

    it("ranks by upvote count, most voted first", async () => {
      const inserted = await db
        .insert(projects)
        .values([
          projectFixture({ publisherId, categoryId, slug: "poucos-votos" }),
          projectFixture({ publisherId, categoryId, slug: "muitos-votos" }),
        ])
        .returning({ id: projects.id, slug: projects.slug });

      const popular = inserted.find((p) => p.slug === "muitos-votos")!;

      const voterIds = [randomUUID(), randomUUID()];
      for (const voterId of voterIds) {
        await db.insert(users).values({
          id: voterId,
          name: "Voter",
          email: "voter-" + voterId + "@example.com",
          role: "user",
        });
      }

      await db
        .insert(projectUpvotes)
        .values(voterIds.map((userId) => ({ projectId: popular.id, userId })));

      const response = await server.inject({
        method: "GET",
        url: "/v1/projects?sort=upvotes",
      });

      const slugs = response.json().data.map((p: { slug: string }) => p.slug);
      expect(slugs).toEqual(["muitos-votos", "poucos-votos"]);
      expect(response.json().data[0].upvoteCount).toBe(2);
    });

    it("serves a named week through the leaderboard and rejects unknown ones", async () => {
      await db
        .insert(projects)
        .values(
          projectFixture({ publisherId, categoryId, slug: "desta-semana" })
        );

      const current = await server.inject({
        method: "GET",
        url: "/v1/projects/leaderboard",
      });

      expect(current.statusCode).toBe(200);
      expect(current.json().data).toHaveLength(1);

      const named = await server.inject({
        method: "GET",
        url: "/v1/projects/leaderboard?week=" + current.json().meta.week,
      });

      expect(named.statusCode).toBe(200);
      expect(named.json().data).toHaveLength(1);

      const unknown = await server.inject({
        method: "GET",
        url: "/v1/projects/leaderboard?week=2025-W53",
      });

      expect(unknown.statusCode).toBe(404);
    });
  });

  describe("search and filters", () => {
    let publisherId: number;
    let secondCategoryId: number;

    beforeEach(async () => {
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
      publisherId = publisher.id;

      const [second] = await db
        .insert(categories)
        .values({ key: "fintech", name: "Fintech" })
        .returning({ id: categories.id });
      secondCategoryId = second.id;

      await db.insert(projects).values([
        projectFixture({
          publisherId,
          categoryId,
          slug: "tchiga",
          name: "Tchiga",
          shortDescription: "Boleias partilhadas entre as ilhas",
          country: "cv",
          island: "CV7",
          pricing: "free",
          projectStage: "mvp",
          platform: ["web"],
        }),
        projectFixture({
          publisherId,
          categoryId: secondCategoryId,
          slug: "kriolu-learn",
          name: "Kriolu Learn",
          shortDescription: "Aprende crioulo caboverdiano com licoes curtas",
          country: "cv",
          island: "CV2",
          pricing: "paid",
          projectStage: "launched",
          platform: ["mobile"],
        }),
      ]);

      getSessionMock.mockResolvedValue(null);
    });

    async function search(query: string) {
      const response = await server.inject({
        method: "GET",
        url: "/v1/projects?period=all&" + query,
      });

      expect(response.statusCode).toBe(200);
      return response.json().data.map((p: { slug: string }) => p.slug);
    }

    it("matches free text against the name", async () => {
      expect(await search("q=kriolu")).toEqual(["kriolu-learn"]);
    });

    it("matches free text against the short description", async () => {
      expect(await search("q=boleias")).toEqual(["tchiga"]);
    });

    it("ignores case when searching", async () => {
      expect(await search("q=TCHIGA")).toEqual(["tchiga"]);
    });

    it("filters by island", async () => {
      expect(await search("island=CV2")).toEqual(["kriolu-learn"]);
      expect(await search("island=CV7")).toEqual(["tchiga"]);
    });

    it("filters by category", async () => {
      expect(await search("categoryId=" + secondCategoryId)).toEqual([
        "kriolu-learn",
      ]);
    });

    it("filters by pricing and stage", async () => {
      expect(await search("pricing=paid")).toEqual(["kriolu-learn"]);
      expect(await search("projectStage=mvp")).toEqual(["tchiga"]);
    });

    it("filters by supported platform", async () => {
      expect(await search("platform=mobile")).toEqual(["kriolu-learn"]);
    });

    it("combines filters", async () => {
      expect(await search("q=kriolu&island=CV2")).toEqual([
        "kriolu-learn",
      ]);
      // Same text, wrong island: nothing matches.
      expect(await search("q=kriolu&island=CV7")).toEqual([]);
    });

    it("never returns a draft through search", async () => {
      await db
        .update(projects)
        .set({ status: "draft" })
        .where(eq(projects.slug, "kriolu-learn"));

      expect(await search("q=kriolu")).toEqual([]);
    });

    it("rejects an island that is not a real one", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/v1/projects?island=atlantis",
      });

      expect(response.statusCode).toBe(400);
    });

    describe("location", () => {
      function asOwner() {
        getSessionMock.mockResolvedValue({
          user: { id: currentUserId, role: "user" },
        });
      }

      async function create(name: string, location?: unknown) {
        const { location: _default, ...rest } = validProjectPayload;

        return server.inject({
          method: "POST",
          url: "/v1/projects",
          payload: { ...rest, name, categoryId, ...(location ? { location } : {}) },
        });
      }

      it("stores a Cabo Verde location as flat columns", async () => {
        asOwner();

        const response = await create("Djunta Mon", {
          country: "cv",
          island: "CV8",
          municipality: "CV882",
        });

        expect(response.statusCode).toBe(201);

        const record = await db.query.projects.findFirst({
          where: eq(projects.id, response.json().data.id),
        });
        expect(record).toMatchObject({
          country: "cv",
          island: "CV8",
          municipality: "CV882",
          zone: null,
        });
      });

      it("stores an abroad location with nothing below the country", async () => {
        asOwner();

        const response = await create("Kriolu Lisboa", { country: "pt" });

        expect(response.statusCode).toBe(201);

        const record = await db.query.projects.findFirst({
          where: eq(projects.id, response.json().data.id),
        });
        expect(record).toMatchObject({
          country: "pt",
          island: null,
          municipality: null,
          zone: null,
        });
      });

      it("returns the location nested, without the flat columns", async () => {
        asOwner();

        const created = await create("Djunta Mon", {
          country: "cv",
          island: "CV8",
          municipality: "CV882",
        });

        const response = await server.inject({
          method: "GET",
          url: `/v1/projects/${created.json().data.slug}`,
        });

        expect(response.statusCode).toBe(200);

        const { data } = response.json();
        expect(data.location).toEqual({
          country: "cv",
          island: "CV8",
          municipality: "CV882",
        });
        expect(data).not.toHaveProperty("country");
        expect(data).not.toHaveProperty("island");
        expect(data).not.toHaveProperty("municipality");
        expect(data).not.toHaveProperty("zone");
      });

      it("returns a null location for a project that predates the field", async () => {
        const [legacy] = await db
          .insert(projects)
          .values(
            projectFixture({
              publisherId,
              categoryId,
              slug: "antigo",
              country: null,
              island: null,
            })
          )
          .returning({ slug: projects.slug });

        const response = await server.inject({
          method: "GET",
          url: `/v1/projects/${legacy.slug}`,
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().data.location).toBeNull();
      });

      it("replaces the whole location on update, clearing the old island", async () => {
        asOwner();

        const created = await create("Mudou de Pais", {
          country: "cv",
          island: "CV7",
          municipality: "CV774",
        });
        const id = created.json().data.id;

        const response = await server.inject({
          method: "PATCH",
          url: `/v1/projects/${id}`,
          payload: { location: { country: "us" } },
        });

        expect(response.statusCode).toBe(200);

        const record = await db.query.projects.findFirst({
          where: eq(projects.id, id),
        });
        expect(record).toMatchObject({
          country: "us",
          island: null,
          municipality: null,
        });
      });

      it("leaves the location alone when an update does not send one", async () => {
        asOwner();

        const created = await create("Fica Onde Esta", {
          country: "cv",
          island: "CV4",
        });
        const id = created.json().data.id;

        const response = await server.inject({
          method: "PATCH",
          url: `/v1/projects/${id}`,
          payload: { name: "Fica Onde Esta 2" },
        });

        expect(response.statusCode).toBe(200);

        const record = await db.query.projects.findFirst({
          where: eq(projects.id, id),
        });
        expect(record).toMatchObject({ country: "cv", island: "CV4" });
      });

      it("requires a location when creating a project", async () => {
        asOwner();

        const response = await create("Sem Sitio");

        expect(response.statusCode).toBe(400);
      });

      it.each([
        ["a Cabo Verde location without an island", { country: "cv" }],
        [
          "a municipality on the wrong island",
          { country: "cv", island: "CV1", municipality: "CV774" },
        ],
        [
          "an island alongside an abroad country",
          { country: "pt", island: "CV7" },
        ],
        ["an unknown country", { country: "xx" }],
        [
          "a zone without its municipality",
          { country: "cv", island: "CV7", zone: "CV77400000001" },
        ],
      ])("rejects %s", async (_label, location) => {
        asOwner();

        const response = await create("Localizacao Errada", location);

        expect(response.statusCode).toBe(400);
      });
    });
  });
});
