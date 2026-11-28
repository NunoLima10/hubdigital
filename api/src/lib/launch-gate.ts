import { config } from "@/config";
import { logger } from "@/utils/logger";
import { z } from "zod";
import {
  LAUNCH_GATE_FLAG,
  parseLaunchGatePayload,
  type LaunchGate,
} from "@hubdigital/shared";

/**
 * Reads the pre-launch lock (the `launch-gate` remote config flag) from
 * PostHog's public /flags endpoint with the project token, the same call the
 * web SDK makes. See packages/shared/src/launch-gate.ts for the payload.
 *
 * Every request is gated on this, so it is cached for a short while and a
 * failed refresh keeps the last value it read. Before the first successful
 * read, or without a PostHog token, LAUNCH_GATE_DEFAULT decides.
 */

const CACHE_MS = 30_000;
const FETCH_TIMEOUT_MS = 3_000;
// The flag is the same for everyone; this is just who PostHog evaluates it for.
const DISTINCT_ID = "hubdigital-api-launch-gate";

const OPEN: LaunchGate = { locked: false, launchAt: null };

let cached: { gate: LaunchGate; fetchedAt: number } | null = null;
let inflight: Promise<LaunchGate> | null = null;

const flagsResponse = z.object({
  errorsWhileComputingFlags: z.boolean().optional(),
  quotaLimited: z.array(z.string()).optional(),
  flags: z.record(z.string(), z.object({
    enabled: z.boolean(),
    failed: z.boolean().optional(),
    metadata: z.object({ payload: z.unknown().optional() }).nullable().optional(),
  })).optional(),
  featureFlags: z.record(z.string(), z.union([z.boolean(), z.string()])).optional(),
  featureFlagPayloads: z.record(z.string(), z.unknown()).optional(),
});

async function fetchGate(): Promise<LaunchGate> {
  const url = new URL("/flags/?v=2", config.POSTHOG_HOST);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: config.POSTHOG_API_KEY,
      distinct_id: DISTINCT_ID,
      flag_keys_to_evaluate: [LAUNCH_GATE_FLAG],
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`PostHog /flags answered ${response.status}`);

  const body = flagsResponse.parse(await response.json());
  const flag = body.flags?.[LAUNCH_GATE_FLAG];
  if ((!body.flags && !body.featureFlags) || body.errorsWhileComputingFlags ||
      body.quotaLimited?.includes("feature_flags") || flag?.failed) {
    throw new Error("PostHog launch gate evaluation incomplete");
  }
  const enabled = flag?.enabled ?? Boolean(body.featureFlags?.[LAUNCH_GATE_FLAG]);
  // Off or deleted: the site is open.
  if (!enabled) return OPEN;

  const payload = flag?.metadata?.payload ?? body.featureFlagPayloads?.[LAUNCH_GATE_FLAG];
  return parseLaunchGatePayload(payload);
}

function fallback(): LaunchGate {
  return cached?.gate ?? (config.LAUNCH_GATE_DEFAULT === "locked" ? { locked: true, launchAt: null } : OPEN);
}

export async function getLaunchGate(): Promise<LaunchGate> {
  if (!config.POSTHOG_API_KEY || config.NODE_ENV === "test") return fallback();
  if (cached && Date.now() - cached.fetchedAt < CACHE_MS) return cached.gate;

  inflight ??= fetchGate()
    .then((gate) => {
      cached = { gate, fetchedAt: Date.now() };
      return gate;
    })
    .catch((error: unknown) => {
      logger.warn({ err: error }, "Could not read the launch gate from PostHog");
      const gate = fallback();
      // Retry on the next cache window rather than on every request.
      cached = { gate, fetchedAt: Date.now() };
      return gate;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
