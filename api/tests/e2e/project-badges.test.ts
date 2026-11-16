import { randomUUID } from "node:crypto";
import { setupDB, teardownDB } from "@/db";
import {
  moderationActions,
  projectAnnouncements,
  projectBadgeAwards,
  projectUpvotes,
  weeklyRankingResults,
} from "@/db/schemas";
import { ProjectBadgesService } from "@/modules/project-badges/project-badges-services";
import { buildServer } from "@/server";
import { previousWeek } from "@/utils/week";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { and, eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import type { FastifyInstance } from "fastify";
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
import {
  insertCategory,
  insertProject,
  insertPublisher,
  insertUser,
  migrationsFolder,
  resetDb,
} from "./helpers/admin-harness";

const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }));

vi.mock("../../src/lib/auth", () => ({
  auth: {
    api: { getSession: getSessionMock, updateUser: vi.fn() },
    handler: vi.fn(),
  },
}));

describe("Project badges (e2e)", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
  let connectionUri: string;
  let dbClient: Awaited<ReturnType<typeof setupDB>>["dbClient"];
  let db: Awaited<ReturnType<typeof setupDB>>["db"];
  let server: FastifyInstance;

  let adminId: string;
  let makerId: string;
  let publisherId: number;
  let categoryId: number;

  function signedInAs(id: string, role = "user") {
    getSessionMock.mockResolvedValue({ user: { id, role } });
  }

  /** Upvotes from fresh accounts, cast at `at`. */
  async function addUpvotes(projectId: number, total: number, at: Date) {
    for (let i = 0; i < total; i++) {
      const userId = await insertUser(db, { name: `Votante ${i}` });
      await db
        .insert(projectUpvotes)
        .values({ projectId, userId, createdAt: at.toISOString() });
    }
  }

  async function launchIn(projectId: number, at: Date) {
    await db.insert(projectAnnouncements).values({
      projectId,
      kind: "first_release",
      introduction: "O primeiro lançamento no Hub Digital",
      creationKey: randomUUID(),
      status: "published",
      publishedAt: at.toISOString(),
    });
  }

  async function awardsOf(projectId: number) {
    return db.query.projectBadgeAwards.findMany({
      where: eq(projectBadgeAwards.projectId, projectId),
    });
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

    await db.delete(weeklyRankingResults);
    await db.delete(projectBadgeAwards);
    await resetDb(db);

    adminId = await insertUser(db, { role: "admin", name: "Admin" });
    makerId = await insertUser(db, { name: "Maker" });
    publisherId = await insertPublisher(db, makerId);
    categoryId = await insertCategory(db);

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

  describe("upvote milestones", () => {
    it("awards the plaque on the vote that reaches it and keeps it after a vote is removed", async () => {
      const project = await insertProject(db, { publisherId, categoryId, slug: "apoiado" });
      await addUpvotes(project.id, 9, new Date());

      const voterId = await insertUser(db, { name: "Décimo" });
      signedInAs(voterId);
      const vote = await server.inject({ method: "POST", url: `/v1/projects/${project.id}/upvote` });
      expect(vote.statusCode).toBe(200);
      expect((await awardsOf(project.id)).map((a) => a.badgeKey)).toEqual(["upvotes-10"]);

      // Taking the vote back does not take the plaque back.
      await server.inject({ method: "POST", url: `/v1/projects/${project.id}/upvote` });
      expect((await awardsOf(project.id)).map((a) => a.badgeKey)).toEqual(["upvotes-10"]);
    });

    it("catches up milestones and numbers pioneers in the periodic run", async () => {
      const first = await insertProject(db, {
        publisherId,
        categoryId,
        slug: "primeiro",
        publishedAt: "2026-01-01T10:00:00Z",
      });
      const second = await insertProject(db, {
        publisherId,
        categoryId,
        slug: "segundo",
        publishedAt: "2026-01-02T10:00:00Z",
      });
      await addUpvotes(second.id, 50, new Date());

      await ProjectBadgesService.runAutomaticAwards(db);
      await ProjectBadgesService.runAutomaticAwards(db);

      const firstAwards = await awardsOf(first.id);
      expect(firstAwards).toEqual([expect.objectContaining({ badgeKey: "pioneer", rank: 1 })]);
      const secondKeys = (await awardsOf(second.id)).map((a) => a.badgeKey).sort();
      expect(secondKeys).toEqual(["pioneer", "upvotes-10", "upvotes-50"]);
    });
  });

  describe("weekly close", () => {
    it("freezes the ranking at the close, awards plaques above the minimum and runs once", async () => {
      const week = previousWeek();
      const midWeek = new Date(week.start.getTime() + 2 * 86_400_000);
      const afterClose = new Date(week.end.getTime() + 60_000);

      const leader = await insertProject(db, { publisherId, categoryId, slug: "lider" });
      const runnerUp = await insertProject(db, { publisherId, categoryId, slug: "segundo-lugar" });
      const third = await insertProject(db, { publisherId, categoryId, slug: "terceiro-lugar" });
      for (const project of [leader, runnerUp, third]) await launchIn(project.id, midWeek);

      await addUpvotes(leader.id, 7, midWeek);
      await addUpvotes(runnerUp.id, 5, midWeek);
      await addUpvotes(third.id, 2, midWeek);
      // Votes after the close count for the public ranking, not for the plaque.
      await addUpvotes(third.id, 10, afterClose);

      expect(await ProjectBadgesService.closeWeek(db, week)).toBe(3);
      expect(await ProjectBadgesService.closeWeek(db, week)).toBeNull();

      expect(await awardsOf(leader.id)).toEqual([
        expect.objectContaining({ badgeKey: "weekly-top-1", period: week.weekId, rank: 1 }),
      ]);
      expect(await awardsOf(runnerUp.id)).toEqual([
        expect.objectContaining({ badgeKey: "weekly-top-3", period: week.weekId, rank: 2 }),
      ]);
      // Third place has fewer than the minimum upvotes at the close.
      expect(await awardsOf(third.id)).toEqual([]);

      const detail = await server.inject({ method: "GET", url: "/v1/projects/lider" });
      expect(detail.statusCode).toBe(200);
      expect(detail.json().data.badges).toEqual([
        expect.objectContaining({ key: "weekly-top-1", period: week.weekId, rank: 1 }),
      ]);
      expect(detail.json().data.bestWeeklyRank).toEqual({ rank: 1, week: week.weekId, times: 1 });

      const thirdDetail = await server.inject({ method: "GET", url: "/v1/projects/terceiro-lugar" });
      expect(thirdDetail.json().data.bestWeeklyRank).toEqual({ rank: 3, week: week.weekId, times: 1 });
    });
  });

  describe("live weekly rank", () => {
    it("orders this week's projects by their own upvotes", async () => {
      // The older project has more votes; a bug once counted every project as
      // one vote, which put the newest first.
      const now = new Date();
      const ahead = await insertProject(db, { publisherId, categoryId, slug: "na-frente" });
      const behind = await insertProject(db, { publisherId, categoryId, slug: "atras" });
      for (const project of [ahead, behind]) await launchIn(project.id, now);
      await addUpvotes(ahead.id, 3, now);
      await addUpvotes(behind.id, 1, now);

      const first = await server.inject({ method: "GET", url: "/v1/projects/na-frente" });
      const second = await server.inject({ method: "GET", url: "/v1/projects/atras" });
      expect(first.json().data.weeklyRank).toEqual(expect.objectContaining({ rank: 1, total: 2 }));
      expect(second.json().data.weeklyRank).toEqual(expect.objectContaining({ rank: 2, total: 2 }));
    });
  });

  describe("admin", () => {
    it("grants and revokes manual badges, with an audit row each time", async () => {
      const project = await insertProject(db, { publisherId, categoryId, slug: "escolhido" });
      signedInAs(adminId, "admin");

      const grant = await server.inject({
        method: "POST",
        url: `/v1/admin/projects/${project.id}/badges`,
        payload: { key: "staff-pick" },
      });
      expect(grant.statusCode).toBe(201);
      const awardId = grant.json().data.id;

      const again = await server.inject({
        method: "POST",
        url: `/v1/admin/projects/${project.id}/badges`,
        payload: { key: "staff-pick" },
      });
      expect(again.statusCode).toBe(409);

      const detail = await server.inject({ method: "GET", url: `/v1/admin/projects/${project.id}` });
      expect(detail.json().data.badges).toEqual([
        expect.objectContaining({ key: "staff-pick", awardedBy: { id: adminId, name: "Admin" } }),
      ]);

      const revoke = await server.inject({
        method: "DELETE",
        url: `/v1/admin/projects/${project.id}/badges/${awardId}`,
      });
      expect(revoke.statusCode).toBe(200);
      expect(await awardsOf(project.id)).toEqual([]);

      const audit = await db.query.moderationActions.findMany({
        where: and(eq(moderationActions.targetType, "project"), eq(moderationActions.targetId, String(project.id))),
      });
      expect(audit.map((row) => row.action).sort()).toEqual(["project.badge_grant", "project.badge_revoke"]);
    });

    it("keeps one project of the month per month and needs the month", async () => {
      const first = await insertProject(db, { publisherId, categoryId, slug: "mes-a" });
      const second = await insertProject(db, { publisherId, categoryId, slug: "mes-b" });
      signedInAs(adminId, "admin");

      const noMonth = await server.inject({
        method: "POST",
        url: `/v1/admin/projects/${first.id}/badges`,
        payload: { key: "project-of-month" },
      });
      expect(noMonth.statusCode).toBe(400);

      const november = await server.inject({
        method: "POST",
        url: `/v1/admin/projects/${first.id}/badges`,
        payload: { key: "project-of-month", period: "2026-11" },
      });
      expect(november.statusCode).toBe(201);
      expect(november.json().data).toEqual(expect.objectContaining({ period: "2026-11" }));

      const taken = await server.inject({
        method: "POST",
        url: `/v1/admin/projects/${second.id}/badges`,
        payload: { key: "project-of-month", period: "2026-11" },
      });
      expect(taken.statusCode).toBe(409);

      const december = await server.inject({
        method: "POST",
        url: `/v1/admin/projects/${second.id}/badges`,
        payload: { key: "project-of-month", period: "2026-12" },
      });
      expect(december.statusCode).toBe(201);
    });

    it("refuses to hand out or remove automatic badges, and is staff only", async () => {
      const project = await insertProject(db, { publisherId, categoryId, slug: "automatico" });
      await ProjectBadgesService.awardUpvoteMilestones(db, project.id, 10);
      const [milestone] = await awardsOf(project.id);

      signedInAs(adminId, "admin");
      const grant = await server.inject({
        method: "POST",
        url: `/v1/admin/projects/${project.id}/badges`,
        payload: { key: "weekly-top-1" },
      });
      expect(grant.statusCode).toBe(400);

      const revoke = await server.inject({
        method: "DELETE",
        url: `/v1/admin/projects/${project.id}/badges/${milestone.id}`,
      });
      expect(revoke.statusCode).toBe(400);
      expect(await awardsOf(project.id)).toHaveLength(1);

      signedInAs(makerId);
      const asMaker = await server.inject({
        method: "POST",
        url: `/v1/admin/projects/${project.id}/badges`,
        payload: { key: "staff-pick" },
      });
      expect(asMaker.statusCode).toBe(403);
    });
  });
  describe("celebrations", () => {
    it("lists unseen awards on the maker's own projects and marks them seen", async () => {
      const mine = await insertProject(db, { publisherId, categoryId, slug: "meu" });
      const otherId = await insertUser(db, { name: "Outra" });
      const otherPublisherId = await insertPublisher(db, otherId);
      const theirs = await insertProject(db, {
        publisherId: otherPublisherId,
        categoryId,
        slug: "delas",
      });

      const [fresh] = await db
        .insert(projectBadgeAwards)
        .values({ projectId: mine.id, badgeKey: "upvotes-10" })
        .returning();
      await db.insert(projectBadgeAwards).values({
        projectId: mine.id,
        badgeKey: "pioneer",
        rank: 3,
        seenAt: new Date().toISOString(),
      });
      const [foreign] = await db
        .insert(projectBadgeAwards)
        .values({ projectId: theirs.id, badgeKey: "upvotes-10" })
        .returning();

      signedInAs(makerId);
      const unseen = await server.inject({ method: "GET", url: "/v1/project-badges/me/unseen" });
      expect(unseen.statusCode).toBe(200);
      const { data } = unseen.json();
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject({
        id: fresh.id,
        key: "upvotes-10",
        project: { id: mine.id, slug: "meu" },
      });

      // Someone else's award id is ignored, not marked.
      const seen = await server.inject({
        method: "POST",
        url: "/v1/project-badges/me/seen",
        payload: { ids: [fresh.id, foreign.id] },
      });
      expect(seen.statusCode).toBe(200);
      expect(seen.json().data).toEqual([]);

      const foreignRow = await db.query.projectBadgeAwards.findFirst({
        where: eq(projectBadgeAwards.id, foreign.id),
      });
      expect(foreignRow?.seenAt).toBeNull();
    });

    it("needs a signed-in user", async () => {
      getSessionMock.mockResolvedValue(null);
      const response = await server.inject({ method: "GET", url: "/v1/project-badges/me/unseen" });
      expect(response.statusCode).toBe(401);
    });
  });
});
