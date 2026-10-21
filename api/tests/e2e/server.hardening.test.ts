import { setupDB, teardownDB } from "@/db";
import { buildServer } from "@/server";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { FastifyInstance } from "fastify";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import "../setup-env";

vi.mock("../../src/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() }, handler: vi.fn() },
}));

describe("Server hardening (e2e)", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
  let connectionUri: string;
  let dbClient: Awaited<ReturnType<typeof setupDB>>["dbClient"] | undefined;
  let server: FastifyInstance | undefined;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17").start();
    connectionUri = container.getConnectionUri();
  });

  afterEach(async () => {
    if (server) await server.close();
    if (dbClient) await teardownDB(dbClient);
    server = undefined;
    dbClient = undefined;
    vi.doUnmock("@/config");
    vi.resetModules();
  });

  afterAll(async () => {
    if (container) await container.stop();
  });

  async function start(build: typeof buildServer = buildServer) {
    const setupResult = await setupDB(connectionUri);
    dbClient = setupResult.dbClient;
    server = await build(setupResult.db);
    await server.ready();
    return { server, dbClient };
  }

  /** Re-imports the server with `config.isProd` forced on. */
  async function productionBuildServer() {
    vi.resetModules();
    vi.doMock("@/config", async (importOriginal) => {
      const actual = await importOriginal<typeof import("@/config")>();
      return { config: { ...actual.config, isDev: false, isProd: true } };
    });
    const module = await vi.importActual<typeof import("@/server")>("@/server");
    return module.buildServer;
  }

  it("sends security headers on API responses", async () => {
    const { server } = await start();

    const response = await server.inject({ method: "GET", url: "/healthcheck" });

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(response.headers["strict-transport-security"]).toBeDefined();
    expect(response.headers["cross-origin-resource-policy"]).toBe("same-site");
  });

  it("reports a healthy database", async () => {
    const { server } = await start();

    const response = await server.inject({ method: "GET", url: "/healthcheck" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok", database: "ok" });
  });

  it("answers 503 when the database is unreachable", async () => {
    const { server, dbClient: client } = await start();
    await teardownDB(client);
    dbClient = undefined;

    const response = await server.inject({ method: "GET", url: "/healthcheck" });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: "error", database: "unreachable" });
  });

  it("serves the API docs outside production", async () => {
    const { server } = await start();

    const response = await server.inject({ method: "GET", url: "/docs" });

    expect(response.statusCode).not.toBe(404);
  });

  it("hides the API docs and applies a strict CSP in production", async () => {
    const { server } = await start(await productionBuildServer());

    const docs = await server.inject({ method: "GET", url: "/docs" });
    const docsJson = await server.inject({ method: "GET", url: "/docs/json" });
    const root = await server.inject({ method: "GET", url: "/" });
    const health = await server.inject({ method: "GET", url: "/healthcheck" });

    expect(docs.statusCode).toBe(404);
    expect(docsJson.statusCode).toBe(404);
    expect(root.statusCode).toBe(404);
    expect(health.headers["content-security-policy"]).toBe(
      "default-src 'none';frame-ancestors 'none'"
    );
  });
});
