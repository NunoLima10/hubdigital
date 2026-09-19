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

describe("Comments module (e2e)", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
  let connectionUri: string;

  let dbClient: Awaited<ReturnType<typeof setupDB>>["dbClient"];
  let db: Awaited<ReturnType<typeof setupDB>>["db"];
  let server: FastifyInstance;
  let currentUserId: string;
  let otherUserId: string;
  let projectId: number;

  function signedInAs(userId: string, role = "user") {
    getSessionMock.mockResolvedValue({ user: { id: userId, role } });
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

    await db.delete(comments);
    await db.delete(projects);
    await db.delete(publishers);
    await db.delete(users);
    await db.delete(categories);

    currentUserId = randomUUID();
    otherUserId = randomUUID();

    await db.insert(users).values([
      {
        id: currentUserId,
        name: "Ana",
        email: "ana-" + currentUserId + "@example.com",
        role: "user",
      },
      {
        id: otherUserId,
        name: "Bruno",
        email: "bruno-" + otherUserId + "@example.com",
        role: "user",
      },
    ]);

    const [category] = await db
      .insert(categories)
      .values({ key: "ai", name: "Inteligencia Artificial" })
      .returning({ id: categories.id });

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
        categoryId: category.id,
        slug: "meu-projeto",
        name: "Meu Projeto",
        shortDescription: "Uma plataforma para descobrir projetos digitais",
        websiteUrl: "https://hubdigital.cv",
        pricing: "free",
        platform: ["web"],
        businessModel: "b2c",
        access: "public_beta",
        projectStage: "mvp",
        audienceStage: "general_public",
        island: "santiago",
        status: "published",
        launchedAt: new Date().toISOString(),
      })
      .returning({ id: projects.id });

    projectId = project.id;

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

  async function postComment(body: string, parentId?: number) {
    return server.inject({
      method: "POST",
      url: "/v1/projects/meu-projeto/comments",
      payload: parentId ? { body, parentId } : { body },
    });
  }

  it("rejects an unauthenticated comment", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await postComment("Bom trabalho!");

    expect(response.statusCode).toBe(401);
    expect(await db.query.comments.findMany()).toHaveLength(0);
  });

  it("rejects an empty comment", async () => {
    signedInAs(currentUserId);

    const response = await postComment("   ");

    expect(response.statusCode).toBe(400);
  });

  it("posts a comment and returns it in the thread", async () => {
    signedInAs(currentUserId);

    const created = await postComment("Bom trabalho!");
    expect(created.statusCode).toBe(201);
    expect(created.json().data).toMatchObject({
      body: "Bom trabalho!",
      parentId: null,
      isOwn: true,
      isDeleted: false,
    });
    expect(created.json().data.author.name).toBe("Ana");

    const listed = await server.inject({
      method: "GET",
      url: "/v1/projects/meu-projeto/comments",
    });

    expect(listed.statusCode).toBe(200);
    expect(listed.json().data).toHaveLength(1);
    expect(listed.json().data[0].replies).toHaveLength(0);
  });

  it("nests a reply under its parent", async () => {
    signedInAs(currentUserId);
    const parent = await postComment("Alguem sabe se funciona offline?");

    signedInAs(otherUserId);
    const reply = await postComment("Sim, funciona.", parent.json().data.id);

    expect(reply.statusCode).toBe(201);
    expect(reply.json().data.parentId).toBe(parent.json().data.id);

    const listed = await server.inject({
      method: "GET",
      url: "/v1/projects/meu-projeto/comments",
    });

    const thread = listed.json().data;
    expect(thread).toHaveLength(1);
    expect(thread[0].replies).toHaveLength(1);
    expect(thread[0].replies[0].body).toBe("Sim, funciona.");
  });

  it("flattens a reply to a reply onto the top-level comment", async () => {
    signedInAs(currentUserId);
    const parent = await postComment("Pergunta");
    const reply = await postComment("Resposta", parent.json().data.id);

    const nested = await postComment("Resposta da resposta", reply.json().data.id);

    expect(nested.statusCode).toBe(201);
    expect(nested.json().data.parentId).toBe(parent.json().data.id);

    const listed = await server.inject({
      method: "GET",
      url: "/v1/projects/meu-projeto/comments",
    });

    expect(listed.json().data).toHaveLength(1);
    expect(listed.json().data[0].replies).toHaveLength(2);
  });

  it("lets an author edit their own comment but not someone else's", async () => {
    signedInAs(currentUserId);
    const created = await postComment("Primeiro rascunho");
    const commentId = created.json().data.id;

    const mine = await server.inject({
      method: "PATCH",
      url: "/v1/comments/" + commentId,
      payload: { body: "Versao corrigida" },
    });

    expect(mine.statusCode).toBe(200);
    expect(mine.json().data.body).toBe("Versao corrigida");

    signedInAs(otherUserId);
    const theirs = await server.inject({
      method: "PATCH",
      url: "/v1/comments/" + commentId,
      payload: { body: "Sequestrado" },
    });

    expect(theirs.statusCode).toBe(404);

    const record = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
    });
    expect(record?.body).toBe("Versao corrigida");
  });

  it("keeps a deleted comment in place when it still has replies", async () => {
    signedInAs(currentUserId);
    const parent = await postComment("Vou apagar isto");

    signedInAs(otherUserId);
    await postComment("Mas eu ja respondi", parent.json().data.id);

    signedInAs(currentUserId);
    const removed = await server.inject({
      method: "DELETE",
      url: "/v1/comments/" + parent.json().data.id,
    });
    expect(removed.statusCode).toBe(204);

    const listed = await server.inject({
      method: "GET",
      url: "/v1/projects/meu-projeto/comments",
    });

    const thread = listed.json().data;
    expect(thread).toHaveLength(1);
    expect(thread[0].isDeleted).toBe(true);
    expect(thread[0].author).toBeNull();
    expect(thread[0].body).not.toContain("Vou apagar isto");
    expect(thread[0].replies).toHaveLength(1);
  });

  it("drops a deleted comment that has no replies", async () => {
    signedInAs(currentUserId);
    const created = await postComment("Sozinho");

    await server.inject({
      method: "DELETE",
      url: "/v1/comments/" + created.json().data.id,
    });

    const listed = await server.inject({
      method: "GET",
      url: "/v1/projects/meu-projeto/comments",
    });

    expect(listed.json().data).toHaveLength(0);
  });

  it("refuses to delete someone else's comment but allows an admin", async () => {
    signedInAs(currentUserId);
    const created = await postComment("Comentario da Ana");
    const commentId = created.json().data.id;

    signedInAs(otherUserId);
    const asStranger = await server.inject({
      method: "DELETE",
      url: "/v1/comments/" + commentId,
    });
    expect(asStranger.statusCode).toBe(404);

    signedInAs(otherUserId, "admin");
    const asAdmin = await server.inject({
      method: "DELETE",
      url: "/v1/comments/" + commentId,
    });
    expect(asAdmin.statusCode).toBe(204);
  });

  it("counts live comments on the project listing", async () => {
    signedInAs(currentUserId);
    const first = await postComment("Um");
    await postComment("Dois");

    getSessionMock.mockResolvedValue(null);
    let listed = await server.inject({ method: "GET", url: "/v1/projects" });
    expect(listed.json().data[0].commentCount).toBe(2);

    signedInAs(currentUserId);
    await server.inject({
      method: "DELETE",
      url: "/v1/comments/" + first.json().data.id,
    });

    getSessionMock.mockResolvedValue(null);
    listed = await server.inject({ method: "GET", url: "/v1/projects" });
    expect(listed.json().data[0].commentCount).toBe(1);
  });

  it("does not expose comments on a draft project", async () => {
    await db
      .update(projects)
      .set({ status: "draft" })
      .where(eq(projects.id, projectId));

    getSessionMock.mockResolvedValue(null);

    const listed = await server.inject({
      method: "GET",
      url: "/v1/projects/meu-projeto/comments",
    });

    expect(listed.statusCode).toBe(404);
  });
});
