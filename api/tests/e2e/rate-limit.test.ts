import { setupDB, teardownDB } from "@/db";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import type { FastifyInstance } from "fastify";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import "../setup-env";
import { migrationsFolder } from "./helpers/admin-harness";

const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }));

vi.mock("../../src/lib/auth", () => ({
  auth: { api: { getSession: getSessionMock }, handler: vi.fn() },
}));

const LIMIT = 3;
const INTERNAL_KEY = "k".repeat(40);
const URL = "/v1/settings/public";

describe("Rate limiting (e2e)", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
  let connectionUri: string;
  let dbClient: Awaited<ReturnType<typeof setupDB>>["dbClient"] | undefined;
  let server: FastifyInstance | undefined;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17").start();
    connectionUri = container.getConnectionUri();
    const setupResult = await setupDB(connectionUri, { migrating: true });
    await migrate(setupResult.db, { migrationsFolder });
    await teardownDB(setupResult.dbClient);
  });

  afterEach(async () => {
    if (server) await server.close();
    if (dbClient) await teardownDB(dbClient);
    server = undefined;
    dbClient = undefined;
    getSessionMock.mockReset();
    vi.doUnmock("@/config");
    vi.resetModules();
  });

  afterAll(async () => {
    if (container) await container.stop();
  });

  /** A server with a limit of three and the given proxy trust. */
  async function start(trustProxy: unknown = false) {
    vi.resetModules();
    vi.doMock("@/config", async (importOriginal) => {
      const actual = await importOriginal<typeof import("@/config")>();
      return {
        config: {
          ...actual.config,
          RATE_LIMIT_MAX_REQUESTS: LIMIT,
          RATE_LIMIT_WINDOW_MS: 60_000,
          TRUST_PROXY: trustProxy,
          API_INTERNAL_KEY: INTERNAL_KEY,
        },
      };
    });
    const { buildServer } = await vi.importActual<typeof import("@/server")>("@/server");
    const setupResult = await setupDB(connectionUri);
    dbClient = setupResult.dbClient;
    server = await buildServer(setupResult.db);
    await server.ready();
    return server;
  }

  async function statuses(
    app: FastifyInstance,
    count: number,
    options: { remoteAddress?: string; headers?: Record<string, string> } = {},
  ) {
    const codes: number[] = [];
    for (let i = 0; i < count; i++) {
      const response = await app.inject({
        method: "GET",
        url: URL,
        remoteAddress: options.remoteAddress ?? "203.0.113.1",
        headers: options.headers,
      });
      codes.push(response.statusCode);
    }
    return codes;
  }

  it("limits an anonymous IP to the configured budget", async () => {
    const app = await start();

    expect(await statuses(app, LIMIT + 1)).toEqual([200, 200, 200, 429]);
    expect(await statuses(app, 1, { remoteAddress: "203.0.113.2" })).toEqual([200]);
  });

  it("gives each signed-in account its own budget on a shared IP", async () => {
    const app = await start();

    getSessionMock.mockResolvedValue({ user: { id: "ana", role: "user" } });
    expect(await statuses(app, LIMIT)).toEqual([200, 200, 200]);
    getSessionMock.mockResolvedValue({ user: { id: "rui", role: "user" } });
    expect(await statuses(app, LIMIT)).toEqual([200, 200, 200]);
  });

  it("counts a server-side render against the visitor it forwards", async () => {
    const app = await start();
    const ssr = (ip: string) => ({ "x-internal-key": INTERNAL_KEY, "x-client-ip": ip });

    // Same web server address, two visitors: separate budgets.
    expect(await statuses(app, LIMIT, { headers: ssr("198.51.100.7") })).toEqual([200, 200, 200]);
    expect(await statuses(app, 1, { headers: ssr("198.51.100.7") })).toEqual([429]);
    expect(await statuses(app, LIMIT, { headers: ssr("198.51.100.8") })).toEqual([200, 200, 200]);
  });

  it("ignores a forwarded visitor IP without the internal key", async () => {
    const app = await start();
    const spoofed = (ip: string) => ({ "x-client-ip": ip, "x-internal-key": "wrong" });

    await statuses(app, 1, { headers: spoofed("198.51.100.1") });
    await statuses(app, 1, { headers: spoofed("198.51.100.2") });
    await statuses(app, 1, { headers: spoofed("198.51.100.3") });
    // All three counted against the real address, so the fourth is over.
    expect(await statuses(app, 1, { headers: spoofed("198.51.100.4") })).toEqual([429]);
  });

  it("does not throttle a render that cannot name its visitor", async () => {
    const app = await start();

    expect(
      await statuses(app, LIMIT + 2, { headers: { "x-internal-key": INTERNAL_KEY } }),
    ).toEqual([200, 200, 200, 200, 200]);
  });

  it("reads the visitor from X-Forwarded-For behind a trusted proxy", async () => {
    const app = await start((_address: string, hop: number) => hop < 1);
    const via = (ip: string) => ({ headers: { "x-forwarded-for": ip }, remoteAddress: "10.0.0.1" });

    expect(await statuses(app, LIMIT, via("198.51.100.20"))).toEqual([200, 200, 200]);
    expect(await statuses(app, 1, via("198.51.100.21"))).toEqual([200]);
  });

  it("never limits the healthcheck", async () => {
    const app = await start();

    for (let i = 0; i < LIMIT + 2; i++) {
      const response = await app.inject({ method: "GET", url: "/healthcheck" });
      expect(response.statusCode).toBe(200);
    }
  });
});
