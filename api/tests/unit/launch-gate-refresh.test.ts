import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LAUNCH_GATE_FLAG } from "@hubdigital/shared";

const { config } = vi.hoisted(() => ({
  config: {
    NODE_ENV: "production",
    POSTHOG_HOST: "https://posthog.test",
    POSTHOG_API_KEY: "test-token",
    LAUNCH_GATE_DEFAULT: "locked",
  },
}));
vi.mock("../../src/config", () => ({ config }));
vi.mock("../../src/utils/logger", () => ({ logger: { warn: vi.fn() } }));

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  config.POSTHOG_API_KEY = "test-token";
  config.LAUNCH_GATE_DEFAULT = "locked";
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it("respects the default when the token is absent", async () => {
  config.POSTHOG_API_KEY = "";
  const { getLaunchGate } = await import("../../src/lib/launch-gate.js");
  expect((await getLaunchGate()).locked).toBe(true);
});

it.each([
  {},
  { flags: {}, quotaLimited: ["feature_flags"] },
  { flags: {}, errorsWhileComputingFlags: true },
  { flags: { [LAUNCH_GATE_FLAG]: { enabled: false, failed: true } } },
])("retains the last decision on an incomplete evaluation and recovers", async (partial) => {
  config.LAUNCH_GATE_DEFAULT = "open";
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(Response.json({ flags: { [LAUNCH_GATE_FLAG]: { enabled: true } } }))
    .mockResolvedValueOnce(Response.json(partial))
    .mockResolvedValueOnce(Response.json({ flags: { [LAUNCH_GATE_FLAG]: { enabled: false } } })));
  const { getLaunchGate } = await import("../../src/lib/launch-gate.js");
  expect((await getLaunchGate()).locked).toBe(true);
  vi.advanceTimersByTime(30_000);
  expect((await getLaunchGate()).locked).toBe(true);
  vi.advanceTimersByTime(30_000);
  expect((await getLaunchGate()).locked).toBe(false);
});
