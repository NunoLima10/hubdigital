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
  comments,
  projectEvents,
  projectUpvotes,
  projects,
  publishers,
  users,
} from "@/db/schemas";
import { buildServer } from "@/server";
import { shiftDay, toLocalDay } from "@/utils/day";
import { and, eq } from "drizzle-orm";

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

const BROWSER_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const BOT_UA =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

function projectFixture(
  overrides: Partial<typeof projects.$inferInsert> &
    Pick<typeof projects.$inferInsert, "publisherId" | "categoryId" | "slug">
): typeof projects.$inferInsert {
  return {
    name: "Meu Projeto",
    shortDescription: "Uma plataforma para descobrir projetos digitais de CV",
    websiteUrl: "https://hubdigital.cv",
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

describe("Project stats module (e2e)", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
  let connectionUri: string;

  let dbClient: Awaited<ReturnType<typeof setupDB>>["dbClient"];
  let db: Awaited<ReturnType<typeof setupDB>>["db"];
  let server: FastifyInstance;

  let ownerId: string;
  let visitorId: string;
  let publisherId: number;
  let categoryId: number;

  const today = toLocalDay();

  const signInAs = (userId: string | null) =>
    getSessionMock.mockResolvedValue(
      userId ? { user: { id: userId, role: "user" } } : null
    );

  async function createProject(
    slug: string,
    overrides: Partial<typeof projects.$inferInsert> = {}
  ) {
    const [project] = await db
      .insert(projects)
      .values(projectFixture({ publisherId, categoryId, slug, ...overrides }))
      .returning({ id: projects.id });

    return project.id;
  }

  const postEvent = (
    projectId: number,
    body: Record<string, unknown>,
    userAgent = BROWSER_UA
  ) =>
    server.inject({
      method: "POST",
      url: `/v1/projects/${projectId}/events`,
      headers: { "user-agent": userAgent },
      payload: body,
    });

  const eventRows = (projectId: number) =>
    db.query.projectEvents.findMany({
      where: eq(projectEvents.projectId, projectId),
    });

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

    ownerId = randomUUID();
    visitorId = randomUUID();
    await db.insert(users).values([
      {
        id: ownerId,
        name: "Owner",
        email: `owner-${ownerId}@example.com`,
        role: "user",
      },
      {
        id: visitorId,
        name: "Visitor",
        email: `visitor-${visitorId}@example.com`,
        role: "user",
      },
    ]);

    const [publisher] = await db
      .insert(publishers)
      .values({
        userId: ownerId,
        bio: "Building things",
        profileResponse: "founder",
        objectiveResponse: "launch-product",
        locationResponse: "CV1",
        foundUsByResponse: "social-media",
      })
      .returning({ id: publishers.id });
    publisherId = publisher.id;

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

  describe("POST /v1/projects/:id/events", () => {
    it("counts anonymous events into one row per day", async () => {
      signInAs(null);
      const id = await createProject("counted");

      expect((await postEvent(id, { type: "view" })).statusCode).toBe(204);
      expect((await postEvent(id, { type: "view" })).statusCode).toBe(204);
      expect((await postEvent(id, { type: "visit" })).statusCode).toBe(204);

      const rows = await eventRows(id);
      expect(rows).toHaveLength(2);

      const views = rows.find((row) => row.type === "view");
      const visits = rows.find((row) => row.type === "visit");
      expect(views).toMatchObject({ count: 2, source: "web", day: today });
      expect(visits).toMatchObject({ count: 1, source: "web", day: today });
    });

    it("keeps web and app events in separate rows", async () => {
      signInAs(null);
      const id = await createProject("two-sources");

      await postEvent(id, { type: "view", source: "web" });
      await postEvent(id, { type: "view", source: "app" });

      const rows = await eventRows(id);
      expect(rows.map((row) => row.source).sort()).toEqual(["app", "web"]);
    });

    it("ignores bots on the web but not an app's HTTP client", async () => {
      signInAs(null);
      const id = await createProject("bots");

      expect(
        (await postEvent(id, { type: "view" }, BOT_UA)).statusCode
      ).toBe(204);
      expect(await eventRows(id)).toHaveLength(0);

      await postEvent(id, { type: "view", source: "app" }, "okhttp/4.12.0");
      expect(await eventRows(id)).toHaveLength(1);
    });

    it("does not count the owner looking at their own project", async () => {
      signInAs(ownerId);
      const id = await createProject("mine");

      expect((await postEvent(id, { type: "view" })).statusCode).toBe(204);
      expect(await eventRows(id)).toHaveLength(0);

      // A different signed-in user still counts.
      signInAs(visitorId);
      await postEvent(id, { type: "view" });
      expect(await eventRows(id)).toHaveLength(1);
    });

    it("ignores projects that are not publicly visible", async () => {
      signInAs(null);

      const draft = await createProject("draft", { status: "draft" });
      const pending = await createProject("pending", { status: "pending" });
      const banned = await createProject("banned", {
        shadowBannedAt: new Date().toISOString(),
      });
      const deleted = await createProject("deleted", {
        deletedAt: new Date().toISOString(),
      });

      for (const id of [draft, pending, banned, deleted]) {
        expect((await postEvent(id, { type: "view" })).statusCode).toBe(204);
      }

      expect(await db.query.projectEvents.findMany()).toHaveLength(0);
    });

    it("ignores projects whose owner is shadow-banned", async () => {
      signInAs(null);
      const id = await createProject("owner-banned");

      await db
        .update(users)
        .set({ shadowBannedAt: new Date() })
        .where(eq(users.id, ownerId));

      await postEvent(id, { type: "view" });
      expect(await eventRows(id)).toHaveLength(0);
    });

    it("answers 204 for an unknown project so ids cannot be probed", async () => {
      signInAs(null);

      expect((await postEvent(999999, { type: "view" })).statusCode).toBe(204);
    });

    it("rejects an unknown event type", async () => {
      signInAs(null);
      const id = await createProject("bad-type");

      expect((await postEvent(id, { type: "purchase" })).statusCode).toBe(400);
      expect((await postEvent(id, {})).statusCode).toBe(400);
      expect(await eventRows(id)).toHaveLength(0);
    });
  });

  describe("GET /v1/projects/:id/stats", () => {
    const getStats = (projectId: number, range = "7d") =>
      server.inject({
        method: "GET",
        url: `/v1/projects/${projectId}/stats?range=${range}`,
      });

    it("requires authentication", async () => {
      signInAs(null);
      const id = await createProject("private-stats");

      expect((await getStats(id)).statusCode).toBe(401);
    });

    it("requires a publisher profile", async () => {
      signInAs(visitorId);
      const id = await createProject("no-publisher");

      expect((await getStats(id)).statusCode).toBe(403);
    });

    it("hides another maker's project as if it did not exist", async () => {
      const otherUserId = randomUUID();
      await db.insert(users).values({
        id: otherUserId,
        name: "Other",
        email: `other-${otherUserId}@example.com`,
        role: "user",
      });
      await db.insert(publishers).values({
        userId: otherUserId,
        bio: "Also building",
        profileResponse: "founder",
        objectiveResponse: "launch-product",
        locationResponse: "CV1",
        foundUsByResponse: "social-media",
      });

      const id = await createProject("not-yours");

      signInAs(otherUserId);
      expect((await getStats(id)).statusCode).toBe(404);
    });

    it("returns zero-filled series with totals and the previous window", async () => {
      signInAs(ownerId);
      const id = await createProject("stats");

      await db.insert(projectEvents).values([
        { projectId: id, type: "view", source: "web", day: today, count: 10 },
        { projectId: id, type: "view", source: "app", day: today, count: 4 },
        {
          projectId: id,
          type: "visit",
          source: "web",
          day: shiftDay(today, -2),
          count: 3,
        },
        // Falls in the previous 7-day window.
        {
          projectId: id,
          type: "view",
          source: "web",
          day: shiftDay(today, -9),
          count: 6,
        },
        // Older than both windows: counted nowhere.
        {
          projectId: id,
          type: "view",
          source: "web",
          day: shiftDay(today, -30),
          count: 99,
        },
      ]);

      await db.insert(projectUpvotes).values({
        projectId: id,
        userId: visitorId,
      });

      const response = await getStats(id);
      expect(response.statusCode).toBe(200);

      const { data } = response.json();

      expect(data.range).toBe("7d");
      expect(data.to).toBe(today);
      expect(data.from).toBe(shiftDay(today, -6));
      expect(data.series).toHaveLength(7);
      expect(data.series[0].day).toBe(data.from);
      expect(data.series[6].day).toBe(today);

      expect(data.totals).toEqual({
        views: 14,
        visits: 3,
        upvotes: 1,
        comments: 0,
      });
      expect(data.previous).toEqual({
        views: 6,
        visits: 0,
        upvotes: 0,
        comments: 0,
      });

      expect(data.series[6]).toEqual({
        day: today,
        views: 14,
        visits: 0,
        upvotes: 1,
      });
      expect(data.series[4]).toEqual({
        day: shiftDay(today, -2),
        views: 0,
        visits: 3,
        upvotes: 0,
      });
      expect(data.series[0]).toMatchObject({ views: 0, visits: 0, upvotes: 0 });
    });

    it("counts only live comments from other people", async () => {
      signInAs(ownerId);
      const id = await createProject("comment-stats");

      await db.insert(comments).values([
        { projectId: id, userId: visitorId, body: "Counted" },
        { projectId: id, userId: ownerId, body: "The maker replying" },
        {
          projectId: id,
          userId: visitorId,
          body: "Deleted",
          deletedAt: new Date().toISOString(),
        },
        {
          projectId: id,
          userId: visitorId,
          body: "Hidden by staff",
          hiddenAt: new Date().toISOString(),
        },
      ]);

      const { data } = (await getStats(id)).json();

      expect(data.totals.comments).toBe(1);
    });

    it("defaults to 30 days and rejects an unknown range", async () => {
      signInAs(ownerId);
      const id = await createProject("ranges");

      const defaulted = await server.inject({
        method: "GET",
        url: `/v1/projects/${id}/stats`,
      });
      expect(defaulted.json().data.series).toHaveLength(30);

      expect((await getStats(id, "1y")).statusCode).toBe(400);
    });
  });

  describe("GET /v1/projects/mine/stats", () => {
    it("aggregates the caller's projects and ranks them by views", async () => {
      signInAs(ownerId);

      const quiet = await createProject("quiet", { name: "Quiet" });
      const busy = await createProject("busy", { name: "Busy" });
      const draft = await createProject("draft", {
        name: "Draft",
        status: "draft",
      });
      const removed = await createProject("removed", {
        deletedAt: new Date().toISOString(),
      });

      await db.insert(projectEvents).values([
        { projectId: quiet, type: "view", source: "web", day: today, count: 2 },
        { projectId: busy, type: "view", source: "web", day: today, count: 20 },
        { projectId: busy, type: "visit", source: "web", day: today, count: 5 },
        {
          projectId: removed,
          type: "view",
          source: "web",
          day: today,
          count: 500,
        },
      ]);

      const response = await server.inject({
        method: "GET",
        url: "/v1/projects/mine/stats?range=30d",
      });
      expect(response.statusCode).toBe(200);

      const { data } = response.json();

      expect(data.totals).toMatchObject({ views: 22, visits: 5 });
      expect(data.projects.map((p: { id: number }) => p.id)).toEqual([
        busy,
        quiet,
        draft,
      ]);
      expect(data.projects[0]).toMatchObject({
        name: "Busy",
        views: 20,
        visits: 5,
      });
    });

    it("does not include another maker's numbers", async () => {
      const otherUserId = randomUUID();
      await db.insert(users).values({
        id: otherUserId,
        name: "Other",
        email: `other-${otherUserId}@example.com`,
        role: "user",
      });
      const [otherPublisher] = await db
        .insert(publishers)
        .values({
          userId: otherUserId,
          bio: "Also building",
          profileResponse: "founder",
          objectiveResponse: "launch-product",
          locationResponse: "CV1",
          foundUsByResponse: "social-media",
        })
        .returning({ id: publishers.id });

      const [theirs] = await db
        .insert(projects)
        .values(
          projectFixture({
            publisherId: otherPublisher.id,
            categoryId,
            slug: "theirs",
          })
        )
        .returning({ id: projects.id });

      await db.insert(projectEvents).values({
        projectId: theirs.id,
        type: "view",
        source: "web",
        day: today,
        count: 50,
      });

      signInAs(ownerId);
      const { data } = (
        await server.inject({ method: "GET", url: "/v1/projects/mine/stats" })
      ).json();

      expect(data.projects).toEqual([]);
      expect(data.totals.views).toBe(0);
    });
  });

  it("removes a project's counters along with the project", async () => {
    signInAs(null);
    const id = await createProject("cascade");
    await postEvent(id, { type: "view" });

    await db.delete(projects).where(eq(projects.id, id));

    expect(
      await db.query.projectEvents.findMany({
        where: and(eq(projectEvents.projectId, id)),
      })
    ).toHaveLength(0);
  });
});
