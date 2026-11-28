import type { DB } from "@/db";
import { buildServer } from "@/server";
import { parseLaunchGatePayload } from "@hubdigital/shared";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import "../setup-env";

const { getSessionMock, authHandlerMock, gate } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  authHandlerMock: vi.fn(),
  gate: { locked: true, launchAt: "2026-12-05T19:00:00.000Z" as string | null },
}));

vi.mock("../../src/lib/auth", () => ({
  auth: {
    api: { getSession: getSessionMock, updateUser: vi.fn() },
    handler: authHandlerMock,
  },
}));

vi.mock("../../src/lib/launch-gate", () => ({
  getLaunchGate: async () => ({ ...gate }),
}));

const ADMIN_ORIGIN = new URL(process.env.ADMIN_URL ?? "https://admin.hubdigital.cv").origin;

describe("Launch gate payload", () => {
  it("reads locked and a valid date", () => {
    expect(
      parseLaunchGatePayload('{"locked":true,"launchAt":"2026-12-05T18:00:00-01:00"}'),
    ).toEqual({ locked: true, launchAt: "2026-12-05T19:00:00.000Z" });
  });

  it("stays locked when the payload is missing or malformed", () => {
    expect(parseLaunchGatePayload(undefined)).toEqual({ locked: true, launchAt: null });
    expect(parseLaunchGatePayload("{oops")).toEqual({ locked: true, launchAt: null });
  });

  it("opens only on an explicit false", () => {
    expect(parseLaunchGatePayload({ locked: false }).locked).toBe(false);
    expect(parseLaunchGatePayload({ locked: "false" }).locked).toBe(true);
  });

  it("drops dates without time or offset", () => {
    expect(parseLaunchGatePayload({ launchAt: "2026-12-05" }).launchAt).toBeNull();
    expect(parseLaunchGatePayload({ launchAt: "amanhã" }).launchAt).toBeNull();
  });
});

describe("Launch gate hook", () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await buildServer({} as DB);
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(() => {
    gate.locked = true;
    getSessionMock.mockReset().mockResolvedValue(null);
    authHandlerMock.mockReset().mockResolvedValue(new Response("{}", { status: 200 }));
  });

  const asRole = (role: string) =>
    getSessionMock.mockResolvedValue({ user: { id: "u1", role } });

  it("refuses visitors while locked", async () => {
    const res = await server.inject({ method: "GET", url: "/v1/categories" });
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe("FST_SITE_LOCKED");
  });

  it("refuses signed-in users who aren't staff", async () => {
    asRole("user");
    const res = await server.inject({ method: "GET", url: "/v1/projects" });
    expect(res.statusCode).toBe(503);
  });

  it("blocks sign-up and sign-in from the public site", async () => {
    for (const url of ["/v1/auth/sign-up/email", "/v1/auth/sign-in/email", "/v1/auth/sign-in/social"]) {
      const res = await server.inject({
        method: "POST",
        url,
        headers: { origin: "https://hubdigital.cv" },
        payload: {},
      });
      expect(res.statusCode, url).toBe(503);
    }
    expect(authHandlerMock).not.toHaveBeenCalled();
  });

  it("lets the admin app sign in with email", async () => {
    const res = await server.inject({
      method: "POST",
      url: "/v1/auth/sign-in/email",
      headers: { origin: ADMIN_ORIGIN },
      payload: {},
    });
    expect(res.statusCode).toBe(200);
  });

  it("lets staff through", async () => {
    asRole("admin");
    const res = await server.inject({ method: "GET", url: "/v1/launch-campaign/nothing-here" });
    expect(res.statusCode).not.toBe(503);
  });

  it("always answers the launch status", async () => {
    const res = await server.inject({ method: "GET", url: "/v1/launch-status" });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toEqual({
      locked: true,
      launchAt: "2026-12-05T19:00:00.000Z",
      bypass: false,
      now: expect.any(String),
    });

    asRole("admin");
    const staff = await server.inject({ method: "GET", url: "/v1/launch-status" });
    expect(staff.json().data.bypass).toBe(true);
  });

  it("does nothing once open", async () => {
    gate.locked = false;
    const res = await server.inject({
      method: "POST",
      url: "/v1/auth/sign-in/email",
      headers: { origin: "https://hubdigital.cv" },
      payload: {},
    });
    expect(res.statusCode).toBe(200);
  });
});
