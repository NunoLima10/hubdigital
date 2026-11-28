import { z } from "zod";

/**
 * Pre-launch lock, driven by a PostHog remote config flag. While it is on,
 * the web shows the countdown page instead of the site and the API refuses
 * every request from anyone who isn't staff — no sign-up, no sign-in, no data.
 *
 * The flag's JSON payload:
 *
 *   { "locked": true, "launchAt": "2026-12-05T18:00:00-01:00" }
 *
 * - `locked`: true closes the site, false opens it. Missing counts as true, so
 *   turning the flag on without a payload is enough to close it.
 * - `launchAt`: when the countdown ends, as an ISO date with time and offset.
 *   Missing or invalid shows "Em breve" instead of a timer. It never opens
 *   the site by itself; only `locked: false` (or switching the flag off) does.
 *
 * Remote config payloads are readable by anyone holding the public project
 * token, so the payload must never carry secrets.
 */
export const LAUNCH_GATE_FLAG = "launch-gate";

/** A date with time and an explicit offset, e.g. 2026-12-05T18:00:00-01:00. */
const isoDateTime = z.iso.datetime({ offset: true });

/** The launch moment as an ISO string in UTC, or null when unusable. */
export function parseLaunchAt(value: unknown): string | null {
  const parsed = isoDateTime.safeParse(value);
  if (!parsed.success) return null;
  const date = new Date(parsed.data);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export type LaunchGate = {
  locked: boolean;
  launchAt: string | null;
};

/** Reads the flag's payload leniently: anything malformed keeps it locked. */
export function parseLaunchGatePayload(payload: unknown): LaunchGate {
  let value = payload;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      value = {};
    }
  }
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    locked: record.locked !== false,
    launchAt: parseLaunchAt(record.launchAt),
  };
}

/** GET /v1/launch-status */
export const launchStatusSchema = z.object({
  locked: z.boolean(),
  launchAt: z.string().nullable(),
  /** Staff see the real site while it is locked. */
  bypass: z.boolean(),
  /**
   * The API's clock when it answered, so the server render can draw the real
   * countdown instead of placeholders before the browser's clock takes over.
   */
  now: z.string(),
});

export type LaunchStatus = z.infer<typeof launchStatusSchema>;
