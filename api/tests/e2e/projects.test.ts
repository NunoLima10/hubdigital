import { projectAnnouncements } from "@/db/schemas";
import { toWeekId } from "@/utils/week";
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
  fileUploads,
  projectImages,
  projectLinks,
  projectSecondaryCategories,
  projectUpvotes,
  projects,
  publishers,
  users,
} from "@/db/schemas";
import seedCategories from "@/db/seeds/categories";
import { AdminCategoriesService } from "@/modules/admin/categories-services";
import { AdminProjectsService } from "@/modules/admin/projects-services";
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
  links: [{ kind: "website", url: "https://hubdigital.cv", isPrimary: true }],
  pricing: "free",
  platform: ["web"],
  businessModel: "b2c",
  availability: "not_available",
  projectStage: "prototype",
  audiences: ["general_public"],
  location: { country: "cv", island: "CV2" },
  galleryImageKeys: ["project_gallery/test-gallery.png"],
} as const;

/** A row shaped like a live project; override whatever the test cares about. */
function projectFixture(
  overrides: Partial<typeof projects.$inferInsert> &
    Pick<typeof projects.$inferInsert, "publisherId" | "categoryId" | "slug">
): typeof projects.$inferInsert {
  return {
    name: "Meu Projeto",
    shortDescription: validProjectPayload.shortDescription,
    pricing: "free",
    platform: ["web"],
    businessModel: "b2c",
    availability: "not_available",
    projectStage: "prototype",
    audiences: ["general_public"],
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
    await db.insert(fileUploads).values({
      key: validProjectPayload.galleryImageKeys[0],
      userId: currentUserId,
      type: "project_gallery",
      contentType: "image/png",
      completedAt: new Date().toISOString(),
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

      const secondGalleryKey = "project_gallery/second-gallery.png";
      await db.insert(fileUploads).values({
        key: secondGalleryKey,
        userId: currentUserId,
        type: "project_gallery",
        contentType: "image/png",
        completedAt: new Date().toISOString(),
      });

      const second = await server.inject({
        method: "POST",
        url: "/v1/projects",
        payload: {
          ...validProjectPayload,
          categoryId,
          galleryImageKeys: [secondGalleryKey],
        },
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
      const galleryKey = "project_gallery/abc-123-gallery.png";
      await db.insert(fileUploads).values({ key: logoKey, userId: currentUserId, type: "project_logo", contentType: "image/png", completedAt: new Date().toISOString() });
      await db.insert(fileUploads).values({
        key: galleryKey,
        userId: currentUserId,
        type: "project_gallery",
        contentType: "image/png",
        completedAt: new Date().toISOString(),
      });

      const createResponse = await server.inject({
        method: "POST",
        url: "/v1/projects",
        payload: {
          ...validProjectPayload,
          categoryId,
          logoUrl: logoKey,
          galleryImageKeys: [galleryKey],
          youtubeVideoUrl: "https://youtu.be/dQw4w9WgXcQ",
        },
      });

      expect(createResponse.statusCode).toBe(201);
      expect(publisher).toBeDefined();

      // Stored as the raw object key...
      const [record] = await db.query.projects.findMany();
      expect(record.logoUrl).toBe(logoKey);
      expect(record.youtubeVideoId).toBe("dQw4w9WgXcQ");
      const images = await db.query.projectImages.findMany({
        where: eq(projectImages.projectId, record.id),
      });
      expect(images.map((image) => image.storageKey)).toEqual([galleryKey]);

      // ...and handed out as a resolved public url.
      const detailResponse = await server.inject({
        method: "GET",
        url: `/v1/projects/${createResponse.json().data.slug}`,
      });

      expect(detailResponse.json().data.logoUrl).toBe(
        `https://assets.test.hubdigital.cv/${logoKey}`
      );
      expect(detailResponse.json().data.galleryImageUrls).toEqual([
        `https://assets.test.hubdigital.cv/${galleryKey}`,
      ]);
      expect(detailResponse.json().data.youtubeVideoId).toBe("dQw4w9WgXcQ");
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
                pricing: "free",
          platform: ["web"],
          businessModel: "b2c",
          availability: "not_available",
          projectStage: "prototype",
          audiences: ["general_public"],
          status: "published",
          launchedAt: new Date().toISOString(),
        },
        {
          publisherId: otherPublisher.id,
          categoryId,
          slug: "projeto-alheio",
          name: "Projeto Alheio",
          shortDescription: validProjectPayload.shortDescription,
                pricing: "free",
          platform: ["web"],
          businessModel: "b2c",
          availability: "not_available",
          projectStage: "prototype",
          audiences: ["general_public"],
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
                pricing: "free",
          platform: ["web"],
          businessModel: "b2c",
          availability: "not_available",
          projectStage: "prototype",
          audiences: ["general_public"],
          country: "cv",
          island: "CV2",
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
                pricing: "free",
          platform: ["web"],
          businessModel: "b2c",
          availability: "not_available",
          projectStage: "prototype",
          audiences: ["general_public"],
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
                pricing: "free",
          platform: ["web"],
          businessModel: "b2c",
          availability: "not_available",
          projectStage: "prototype",
          audiences: ["general_public"],
          status: "published",
          launchedAt: new Date().toISOString(),
        },
        {
          publisherId: otherPublisher.id,
          categoryId,
          slug: "projeto-alheio",
          name: "Projeto Alheio",
          shortDescription: validProjectPayload.shortDescription,
                pricing: "free",
          platform: ["web"],
          businessModel: "b2c",
          availability: "not_available",
          projectStage: "prototype",
          audiences: ["general_public"],
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
                pricing: "free",
          platform: ["web"],
          businessModel: "b2c",
          availability: "not_available",
          projectStage: "prototype",
          audiences: ["general_public"],
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

    it("saves an incomplete draft, returns actionable publication errors, and completes the same record", async () => {
      await seedPublisher(currentUserId);
      getSessionMock.mockResolvedValue({ user: { id: currentUserId, role: "user" } });
      const created = await server.inject({ method: "POST", url: "/v1/projects", payload: { name: "Nha ideia" } });
      expect(created.statusCode).toBe(201);
      const { id, slug } = created.json().data;
      const mine = await server.inject({ method: "GET", url: "/v1/projects/mine" });
      expect(mine.statusCode).toBe(200);
      expect(mine.json().data[0]).toMatchObject({ id, status: "draft", pricing: null, categoryId: null, links: [], location: null });
      const blocked = await server.inject({ method: "POST", url: `/v1/projects/${id}/publish` });
      expect(blocked.statusCode).toBe(400);
      expect(blocked.json().error.code).toBe("PROJECT_NOT_READY");
      expect(blocked.json().error.issues.map((issue: { path: string }) => issue.path)).toContain("availability");
      getSessionMock.mockResolvedValue(null);
      const privatePage = await server.inject({ method: "GET", url: `/v1/projects/${slug}` });
      expect(privatePage.statusCode).toBe(404);
      getSessionMock.mockResolvedValue({ user: { id: currentUserId, role: "user" } });
      const complete = await server.inject({ method: "PATCH", url: `/v1/projects/${id}`, payload: { ...validProjectPayload, categoryId } });
      expect(complete.statusCode).toBe(200);
      const published = await server.inject({ method: "POST", url: `/v1/projects/${id}/publish` });
      expect(published.statusCode).toBe(200);
      expect(published.json().data).toMatchObject({ id, slug, status: "published" });
      expect(await db.query.projects.findMany()).toHaveLength(1);
      const invalidEdit = await server.inject({ method: "PATCH", url: `/v1/projects/${id}`, payload: { projectStage: null } });
      expect(invalidEdit.statusCode).toBe(400);
      expect(invalidEdit.json().error.code).toBe("PROJECT_NOT_READY");
      const intact = await db.query.projects.findFirst({ where: eq(projects.id, id) });
      expect(intact).toMatchObject({ projectStage: "prototype" });
    });

    it("reuses a creation key even when the name changes after a lost response", async () => {
      await seedPublisher(currentUserId);
      getSessionMock.mockResolvedValue({ user: { id: currentUserId, role: "user" } });
      const creationKey = randomUUID();
      const first = await server.inject({ method: "POST", url: "/v1/projects", payload: { name: "Primeira ideia", creationKey } });
      const retry = await server.inject({ method: "POST", url: "/v1/projects", payload: { name: "Outro nome", creationKey } });
      expect(first.statusCode).toBe(201);
      expect(retry.statusCode).toBe(201);
      expect(retry.json().data).toEqual(first.json().data);
      expect(await db.query.projects.findMany()).toHaveLength(1);
    });

    it("preserves unfinished URLs and country selection in a private draft", async () => {
      await seedPublisher(currentUserId);
      getSessionMock.mockResolvedValue({ user: { id: currentUserId, role: "user" } });
      const response = await server.inject({ method: "POST", url: "/v1/projects", payload: {
        name: "A construir", links: [{ kind: "website", url: "meu-site", isPrimary: true }], youtubeVideoUrl: "https://youtu", location: { country: "cv" },
      } });
      expect(response.statusCode).toBe(201);
      const page = await server.inject({ method: "GET", url: `/v1/projects/${response.json().data.slug}` });
      expect(page.statusCode).toBe(200);
      expect(page.json().data).toMatchObject({ links: [{ url: "meu-site" }], youtubeVideoUrl: "https://youtu", location: { country: "cv" }, draftLocation: { country: "cv" } });
    });

    it("seeds granular categories idempotently while preserving moderator additions", async () => {
      await seedCategories(db);
      const first = await server.inject({ method: "GET", url: "/v1/categories" });
      expect(first.statusCode).toBe(200);
      const rows = first.json().data as { id: number; key: string; name: string }[];
      expect(rows.find((row) => row.key === "travel")?.name).toBe("Turismo");
      expect(rows.find((row) => row.key === "payments")?.name).toBe("Pagamentos");
      expect(rows.find((row) => row.key === "local_services")?.name).toBe("Serviços locais");
      expect(rows.find((row) => row.key === "fishing")?.name).toBe("Pesca");
      expect(rows.some((row) => ["saas", "open_source", "ocean"].includes(row.key))).toBe(false);
      await db.insert(categories).values({ key: "community_custom", name: "Categoria criada pela comunidade" });
      await seedCategories(db);
      const after = (await server.inject({ method: "GET", url: "/v1/categories" })).json().data;
      expect(after).toHaveLength(rows.length + 1);
      for (const row of rows) expect(after).toContainEqual(row);
    });

    it("preserves three categories across publication, editing, all category filters and moderation", async () => {
      await seedPublisher(currentUserId);
      getSessionMock.mockResolvedValue({ user: { id: currentUserId, role: "user" } });
      const added = await db.insert(categories).values([{ key: "travel", name: "Turismo" }, { key: "ecommerce", name: "Comércio" }]).returning();
      const secondaryCategoryIds = added.map((category) => category.id);
      const created = await server.inject({ method: "POST", url: "/v1/projects", payload: { ...validProjectPayload, categoryId, secondaryCategoryIds } });
      expect(created.statusCode).toBe(201);
      const { id, slug } = created.json().data;
      expect((await server.inject({ method: "GET", url: "/v1/projects/mine" })).json().data[0]).toMatchObject({ categoryId, secondaryCategoryIds, secondaryCategories: added.map(({ id, key, name }) => ({ id, key, name })) });
      expect((await server.inject({ method: "POST", url: `/v1/projects/${id}/publish` })).statusCode).toBe(200);
      getSessionMock.mockResolvedValue(null);
      for (const filterId of [categoryId, ...secondaryCategoryIds]) {
        for (const sort of ["upvotes", "newest"]) {
          const listed = await server.inject({ method: "GET", url: `/v1/projects?period=all&sort=${sort}&categoryId=${filterId}` });
          expect(listed.statusCode).toBe(200);
          expect(listed.json().meta.total).toBe(1);
          expect(listed.json().data.map((project: { id: number }) => project.id)).toEqual([id]);
          expect(listed.json().data[0].secondaryCategories.map((category: { id: number }) => category.id)).toEqual(secondaryCategoryIds);
        }
      }
      getSessionMock.mockResolvedValue({ user: { id: currentUserId, role: "user" } });
      const switched = await server.inject({ method: "PATCH", url: `/v1/projects/${id}`, payload: { categoryId: secondaryCategoryIds[0], secondaryCategoryIds: [categoryId, secondaryCategoryIds[1]] } });
      expect(switched.statusCode).toBe(200);
      const page = await server.inject({ method: "GET", url: `/v1/projects/${slug}` });
      expect(page.json().data).toMatchObject({ categoryId: secondaryCategoryIds[0], category: { id: secondaryCategoryIds[0] }, secondaryCategoryIds: [categoryId, secondaryCategoryIds[1]] });
      const admin = await AdminProjectsService.listProjects(db, { limit: 20, offset: 0, sort: "newest", categoryId: categoryId });
      expect(admin.total).toBe(1);
      expect(admin.data[0].secondaryCategoryIds).toEqual([categoryId, secondaryCategoryIds[1]]);
      const counts = await AdminCategoriesService.listWithCounts(db);
      for (const category of counts) expect(category.projectCount).toBe(1);
      const removed = await server.inject({ method: "PATCH", url: `/v1/projects/${id}`, payload: { secondaryCategoryIds: [] } });
      expect(removed.statusCode).toBe(200);
      expect((await server.inject({ method: "GET", url: `/v1/projects?period=all&categoryId=${categoryId}` })).json().meta.total).toBe(0);
    });

    it("rejects repeated, excessive and unknown category selections without creating a project", async () => {
      await seedPublisher(currentUserId);
      getSessionMock.mockResolvedValue({ user: { id: currentUserId, role: "user" } });
      for (const selection of [
        { categoryId, secondaryCategoryIds: [categoryId] },
        { categoryId, secondaryCategoryIds: [999999] },
        { categoryId, secondaryCategoryIds: [2, 2] },
        { categoryId, secondaryCategoryIds: [2, 3, 4] },
        { categoryId: 999999, secondaryCategoryIds: [] },
        { secondaryCategoryIds: [categoryId] },
      ]) {
        const response = await server.inject({ method: "POST", url: "/v1/projects", payload: { name: "Categorias inválidas", ...selection } });
        expect(response.statusCode).toBe(400);
      }
      expect(await db.query.projects.findMany()).toHaveLength(0);
    });

    it("checks category PATCH against the stored selection and rolls back invalid edits", async () => {
      await seedPublisher(currentUserId);
      getSessionMock.mockResolvedValue({ user: { id: currentUserId, role: "user" } });
      const [secondary] = await db.insert(categories).values({ key: "travel", name: "Turismo" }).returning();
      const created = await server.inject({ method: "POST", url: "/v1/projects", payload: { ...validProjectPayload, categoryId, secondaryCategoryIds: [secondary.id] } });
      const { id, slug } = created.json().data;
      for (const payload of [{ categoryId: secondary.id }, { categoryId: null }, { secondaryCategoryIds: [categoryId] }, { secondaryCategoryIds: [999999] }]) {
        expect((await server.inject({ method: "PATCH", url: `/v1/projects/${id}`, payload })).statusCode).toBe(400);
      }
      expect((await server.inject({ method: "GET", url: `/v1/projects/${slug}` })).json().data).toMatchObject({ categoryId, secondaryCategoryIds: [secondary.id] });
    });

    it("enforces distinct primary and secondary categories in the database", async () => {
      const { id: publisherId } = await seedPublisher(currentUserId);
      const [row] = await db.insert(projects).values(projectFixture({ publisherId, categoryId, slug: "db-categories" })).returning();
      await expect(db.insert(projectSecondaryCategories).values({ projectId: row.id, categoryId, position: 0 })).rejects.toThrow();
      expect(await db.query.projectSecondaryCategories.findMany()).toHaveLength(0);
    });

    it("publishes a repository-only open-source beta without business questions and keeps link IDs stable", async () => {
      await seedPublisher(currentUserId);
      getSessionMock.mockResolvedValue({ user: { id: currentUserId, role: "user" } });
      const payload = { name: "Ferramenta CLI", shortDescription: "Uma ferramenta útil na linha de comandos", projectStage: "prototype", availability: "public_beta", sourceModel: "open_source", categoryId,
        description: '<p onclick="bad()">Descrição <strong>útil</strong><script>bad()</script></p>',
        links: [{ kind: "repository", url: "https://codeberg.org/maker/tool", isPrimary: true }],
      };
      const created = await server.inject({ method: "POST", url: "/v1/projects", payload });
      expect(created.statusCode).toBe(201);
      const { id, slug } = created.json().data;
      const before = await server.inject({ method: "GET", url: `/v1/projects/${slug}` });
      const linkId = before.json().data.links[0].id;
      const saved = await server.inject({ method: "PATCH", url: `/v1/projects/${id}`, payload });
      expect(saved.statusCode).toBe(200);
      const published = await server.inject({ method: "POST", url: `/v1/projects/${id}/publish` });
      expect(published.statusCode).toBe(200);
      const after = await server.inject({ method: "GET", url: `/v1/projects/${slug}` });
      expect(after.json().data).toMatchObject({ availability: "public_beta", sourceModel: "open_source", pricing: null, businessModel: null, audiences: [], links: [{ id: linkId, kind: "repository" }] });
      const stored = await db.query.projects.findFirst({ where: eq(projects.id, id) });
      expect(stored?.description).toBe("<p>Descrição <strong>útil</strong></p>");
      const blocked = await server.inject({ method: "PATCH", url: `/v1/projects/${id}`, payload: { links: [] } });
      expect(blocked.statusCode).toBe(400);
      expect(blocked.json().error.issues[0].path).toBe("links");
    });

    it("blocks unowned logos and unfinished attachments until they are verified", async () => {
      await seedPublisher(currentUserId);
      getSessionMock.mockResolvedValue({ user: { id: currentUserId, role: "user" } });
      const logoUrl = "project_logo/not-yet-uploaded.png";
      const payload = { name: "Projeto com imagem", shortDescription: "Uma ideia para dar feedback", projectStage: "idea", availability: "not_available", categoryId, logoUrl };
      const unknown = await server.inject({ method: "POST", url: "/v1/projects", payload });
      expect(unknown.statusCode).toBe(400);
      await db.insert(fileUploads).values({ key: logoUrl, type: "project_logo", userId: currentUserId, contentType: "image/png", byteSize: 8 });
      const created = await server.inject({ method: "POST", url: "/v1/projects", payload });
      expect(created.statusCode).toBe(201);
      const id = created.json().data.id;
      const blocked = await server.inject({ method: "POST", url: `/v1/projects/${id}/publish` });
      expect(blocked.statusCode).toBe(400);
      expect(blocked.json().error.issues[0].path).toBe("logoUrl");
      await db.update(fileUploads).set({ completedAt: new Date().toISOString() }).where(eq(fileUploads.key, logoUrl));
      const allowed = await server.inject({ method: "POST", url: `/v1/projects/${id}/publish` });
      expect(allowed.statusCode).toBe(200);
    });

    it("publishes a directory entry without automatically announcing a release", async () => {
      const publisher = await seedPublisher(currentUserId);
      const [project] = await db
        .insert(projects)
        .values(
          projectFixture({
            publisherId: publisher.id,
            categoryId,
            slug: "meu-rascunho",
            status: "draft",
            availability: "public_beta",
            launchedAt: null,
          })
        )
        .returning({ id: projects.id });

      await db.insert(projectLinks).values({ projectId: project.id, kind: "website", url: "https://hubdigital.cv", position: 0, isPrimary: true });
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
      const week=await server.inject({method:"GET",url:"/v1/projects?period=this_week"});expect(week.json().data).toHaveLength(0);
      expect(await db.query.projectAnnouncements.findMany()).toHaveLength(0);
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

    /** Seven days back lands in the immediately previous week, even on Monday. */
    function lastWeekIso() {
      return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    async function seedAnnouncements(){
      const rows=await db.query.projects.findMany();
      for(const row of rows){const date=row.launchedAt??new Date().toISOString();await db.insert(projectAnnouncements).values({projectId:row.id,kind:"presentation",introduction:"Uma apresentação à comunidade",status:"published",creationKey:randomUUID(),publishedAt:date,week:toWeekId(new Date(date))});}
    }
    it("explicitly filters announced projects by this week", async () => {
      await db.insert(projects).values([
        projectFixture({ publisherId, categoryId, slug: "desta-semana" }),
        projectFixture({
          publisherId,
          categoryId,
          slug: "da-semana-passada",
          launchedAt: lastWeekIso(),
        }),
      ]);

      await seedAnnouncements();
      const response = await server.inject({
        method: "GET",
        url: "/v1/projects?period=this_week",
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

      await seedAnnouncements();
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

      await seedAnnouncements();
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

      await seedAnnouncements();
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
          projectStage: "prototype",
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
          projectStage: "live",
          platform: ["android"],
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
      expect(await search("projectStage=prototype")).toEqual(["tchiga"]);
    });

    it("filters by supported platform", async () => {
      expect(await search("platform=android")).toEqual(["kriolu-learn"]);
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

    describe("worldwide geography", () => {
      beforeEach(async () => {
        getSessionMock.mockResolvedValue({ user:{ id:currentUserId,role:"user" } });
      });
      it("stores worldwide team bases independently from service countries and rounds approximate pins", async () => {
        const response = await server.inject({ method: "POST", url: "/v1/projects", payload: {
          name: "Geography test", languages:["Português","Crioulo cabo-verdiano"], helpWanted:["testers"], helpDescription:"Testar a aplicação", teamDescription:"Equipa da diáspora", location: { country: "jp", locality: "Tokyo", publicPin: { latitude: 35.67891, longitude: 139.71234, precision: "approximate" } },
          additionalLocations: [{country:"pt",locality:"Porto"}], teamMode:"distributed", serviceArea:{scope:"countries",countries:["cv"]}, localConnections:["diaspora"],
        }});
        expect(response.statusCode).toBe(201);
        const page = await server.inject({ method:"GET",url:`/v1/projects/${response.json().data.slug}` });
        expect(page.json().data).toMatchObject({ languages:["Português","Crioulo cabo-verdiano"], helpWanted:["testers"], teamDescription:"Equipa da diáspora", location:{country:"jp",locality:"Tokyo",publicPin:{latitude:35.7,longitude:139.7,precision:"approximate"}}, additionalLocations:[{country:"pt",locality:"Porto"}], serviceArea:{scope:"countries",countries:["cv"]}, localConnections:["diaspora"] });
        const row = await db.query.projects.findFirst({where:eq(projects.id,response.json().data.id)});
        expect(row?.locationDetails.publicPin?.latitude).toBe(35.7);
        expect(row?.locationDetails.publicPin?.longitude).toBe(139.7);
      });
      it("map pages cover more than 100 projects, exclude private records and filter secondary bases", async () => {
        const publisher = await db.query.publishers.findFirst({where:eq(publishers.userId,currentUserId)});
        await db.insert(projects).values(Array.from({length:205},(_,i)=>projectFixture({publisherId:publisher!.id,categoryId,slug:`map-many-${i}`,country:"jp",island:null,additionalLocations:[{country:"pt"}]})));
        await db.insert(projects).values(projectFixture({publisherId:publisher!.id,categoryId,slug:"private-map",status:"draft",country:"jp",island:null}));
        const first=await server.inject({method:"GET",url:"/v1/projects/map?country=pt&limit=200"});
        expect(first.statusCode).toBe(200); expect(first.json().meta.total).toBe(205); expect(first.json().data).toHaveLength(200);
        expect(first.json().data[0]).not.toHaveProperty("description");
        const last=await server.inject({method:"GET",url:"/v1/projects/map?country=pt&limit=200&offset=200"});
        expect(last.json().data).toHaveLength(5);
        expect(new Set([...first.json().data,...last.json().data].map((p:{id:number})=>p.id)).size).toBe(205);
      });
      it("rejects partial/out-of-range coordinates and fake countries", async () => {
        for(const location of [{country:"zz"},{country:"pt",publicPin:{latitude:0,precision:"exact"}},{country:"pt",publicPin:{latitude:91,longitude:0,precision:"exact"}}]) {
          const response=await server.inject({method:"POST",url:"/v1/projects",payload:{name:"Invalid geography",location}});expect(response.statusCode).toBe(400);
        }
      });
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

      it("allows a draft without a location", async () => {
        asOwner();

        const response = await create("Sem Sitio");

        expect(response.statusCode).toBe(201);
      });

      it.each([
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
