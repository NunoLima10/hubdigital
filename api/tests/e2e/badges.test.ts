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
  moderationActions,
  projects,
  publishers,
  userBadges,
  users,
} from "@/db/schemas";
import { buildServer } from "@/server";
import { BadgesService } from "@/modules/badges/badges-services";
import { foundingBadgeFor } from "@hubdigital/shared";
import { eq } from "drizzle-orm";

const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }));

vi.mock("../../src/lib/auth", () => ({
  auth: {
    api: { getSession: getSessionMock, updateUser: vi.fn() },
    handler: vi.fn(),
  },
}));

const migrationsFolder = join(__dirname, "../../src/db/migrations");

describe("Badges (e2e)", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
  let connectionUri: string;
  let dbClient: Awaited<ReturnType<typeof setupDB>>["dbClient"];
  let db: Awaited<ReturnType<typeof setupDB>>["db"];
  let server: FastifyInstance;
  let adminId: string;
  let makerId: string;

  function signedInAs(userId: string, role = "user") {
    getSessionMock.mockResolvedValue({ user: { id: userId, role } });
  }

  async function createUser(name: string, role = "user") {
    const id = randomUUID();
    await db.insert(users).values({
      id,
      name,
      email: `${name.toLowerCase()}-${id}@example.com`,
      role,
    });
    return id;
  }

  function onboard() {
    return server.inject({
      method: "POST",
      url: "/v1/users/onboarding",
      payload: {
        bio: "",
        profileResponses: ["founder"],
        objectiveResponses: ["launch-product"],
        locationResponse: "CV1",
        foundUsByResponse: "friends",
      },
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

    await db.delete(moderationActions);
    await db.delete(userBadges);
    await db.delete(comments);
    await db.delete(projects);
    await db.delete(publishers);
    await db.delete(users);
    await db.delete(categories);

    adminId = await createUser("Admin", "admin");
    makerId = await createUser("Ana");

    server = await buildServer(db);
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
    await teardownDB(dbClient);
  });

  afterAll(async () => {
    await container.stop();
  });

  it("maps join order to founding badges", () => {
    expect(foundingBadgeFor(1)).toBeNull();
    expect(foundingBadgeFor(2)).toBe("founding-gold");
    expect(foundingBadgeFor(10)).toBe("founding-gold");
    expect(foundingBadgeFor(11)).toBe("founding-silver");
    expect(foundingBadgeFor(50)).toBe("founding-silver");
    expect(foundingBadgeFor(51)).toBe("founding-basalt");
    expect(foundingBadgeFor(100)).toBe("founding-basalt");
    expect(foundingBadgeFor(101)).toBeNull();
  });

  it("awards the founding badge on onboarding and features it", async () => {
    // Member #1 is someone else, so Ana joins as a gold member.
    signedInAs(adminId, "admin");
    expect((await onboard()).json().data.badges).toEqual([]);

    signedInAs(makerId);
    const response = await onboard();

    expect(response.statusCode).toBe(201);
    expect(response.json().data.badges).toEqual(["founding-gold"]);

    const mine = await server.inject({ method: "GET", url: "/v1/badges/me" });
    expect(mine.json().data).toEqual([
      expect.objectContaining({
        key: "founding-gold",
        featured: true,
        seenAt: null,
      }),
    ]);

    const handle = (
      await db.query.publishers.findFirst({
        where: eq(publishers.userId, makerId),
      })
    )!.handle;
    const profile = await server.inject({
      method: "GET",
      url: `/v1/makers/${handle}`,
    });
    expect(profile.json().data).toMatchObject({
      featuredBadge: "founding-gold",
      badges: [expect.objectContaining({ key: "founding-gold" })],
    });
  });

  it("lets a user feature, hide and mark badges seen", async () => {
    await BadgesService.awardFoundingBadge(db, makerId, 20);
    await BadgesService.grant(db, makerId, "maintainer", adminId);
    signedInAs(makerId);

    const featured = await server.inject({
      method: "PUT",
      url: "/v1/badges/me/featured",
      payload: { key: "maintainer" },
    });
    expect(featured.statusCode).toBe(200);
    expect(
      featured.json().data.filter((b: { featured: boolean }) => b.featured),
    ).toEqual([expect.objectContaining({ key: "maintainer" })]);

    const notHeld = await server.inject({
      method: "PUT",
      url: "/v1/badges/me/featured",
      payload: { key: "founder" },
    });
    expect(notHeld.statusCode).toBe(404);

    const hidden = await server.inject({
      method: "PUT",
      url: "/v1/badges/me/featured",
      payload: { key: null },
    });
    expect(
      hidden.json().data.every((b: { featured: boolean }) => !b.featured),
    ).toBe(true);

    const seen = await server.inject({
      method: "POST",
      url: "/v1/badges/me/seen",
      payload: { keys: ["maintainer"] },
    });
    const byKey = Object.fromEntries(
      seen.json().data.map((b: { key: string; seenAt: string | null }) => [
        b.key,
        b.seenAt,
      ]),
    );
    expect(byKey.maintainer).not.toBeNull();
    expect(byKey["founding-silver"]).toBeNull();
  });

  it("requires a session for the user's own badges", async () => {
    getSessionMock.mockResolvedValue(null);
    const response = await server.inject({ method: "GET", url: "/v1/badges/me" });
    expect(response.statusCode).toBe(401);
  });

  it("lets staff grant and revoke only manual badges, with an audit trail", async () => {
    signedInAs(adminId, "admin");

    const granted = await server.inject({
      method: "POST",
      url: `/v1/admin/users/${makerId}/badges`,
      payload: { key: "founder" },
    });
    expect(granted.statusCode).toBe(201);

    const again = await server.inject({
      method: "POST",
      url: `/v1/admin/users/${makerId}/badges`,
      payload: { key: "founder" },
    });
    expect(again.statusCode).toBe(409);

    const automatic = await server.inject({
      method: "POST",
      url: `/v1/admin/users/${makerId}/badges`,
      payload: { key: "founding-gold" },
    });
    expect(automatic.statusCode).toBe(400);

    const detail = await server.inject({
      method: "GET",
      url: `/v1/admin/users/${makerId}`,
    });
    expect(detail.json().data.badges).toEqual([
      expect.objectContaining({ key: "founder" }),
    ]);

    const revoked = await server.inject({
      method: "DELETE",
      url: `/v1/admin/users/${makerId}/badges/founder`,
    });
    expect(revoked.statusCode).toBe(200);

    const log = await db.query.moderationActions.findMany({
      where: eq(moderationActions.targetId, makerId),
    });
    expect(log.map((entry) => entry.action).sort()).toEqual([
      "user.badge_grant",
      "user.badge_revoke",
    ]);
  });

  it("keeps the admin badge routes staff-only", async () => {
    signedInAs(makerId);
    const response = await server.inject({
      method: "POST",
      url: `/v1/admin/users/${makerId}/badges`,
      payload: { key: "founder" },
    });
    expect(response.statusCode).toBe(403);
  });

  it("features the next badge when the featured one is revoked", async () => {
    await BadgesService.awardFoundingBadge(db, makerId, 5);
    await BadgesService.grant(db, makerId, "maintainer", adminId);
    await BadgesService.setFeatured(db, makerId, "maintainer");

    await BadgesService.revoke(db, makerId, "maintainer");

    expect(await BadgesService.publicBadgesFor(db, makerId)).toMatchObject({
      featuredBadge: "founding-gold",
    });
  });

  it("shows the author's featured badge on comments", async () => {
    const [category] = await db
      .insert(categories)
      .values({ key: "ai", name: "IA" })
      .returning({ id: categories.id });
    const [publisher] = await db
      .insert(publishers)
      .values({
        handle: "ana",
        userId: makerId,
        bio: "",
        profileResponses: ["founder"],
        objectiveResponses: ["launch-product"],
        locationResponse: "CV1",
        foundUsByResponse: "friends",
      })
      .returning({ id: publishers.id });
    const [project] = await db
      .insert(projects)
      .values({
        publisherId: publisher.id,
        categoryId: category.id,
        slug: "projeto",
        name: "Projeto",
        shortDescription: "Uma plataforma para descobrir projetos digitais",
        pricing: "free",
        platform: ["web"],
        businessModel: "b2c",
        availability: "not_available",
        projectStage: "prototype",
        audiences: ["general_public"],
        country: "cv",
        island: "CV7",
        status: "published",
        launchedAt: new Date().toISOString(),
      })
      .returning({ id: projects.id });
    await db
      .insert(comments)
      .values({ projectId: project.id, userId: makerId, body: "Olá" });
    await BadgesService.grant(db, makerId, "maintainer", adminId);

    getSessionMock.mockResolvedValue(null);
    const response = await server.inject({
      method: "GET",
      url: "/v1/projects/projeto/comments",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data[0].author.badge).toBe("maintainer");
  });
});
