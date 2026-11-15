import { config } from "@/config";
import { logger } from "@/utils/logger";
import { PostHog } from "posthog-node";

/**
 * Server-side product analytics (PostHog). The API is where business facts
 * happen — a project published, a comment posted, an upvote — so they are
 * captured here: no ad blocker can drop them, and the future mobile app gets
 * them for free.
 *
 * Events describe what people do, never who they are: the distinct id is the
 * account id (the same one the web SDK identifies with), and properties must
 * not carry names, emails or free text written by users.
 *
 * With POSTHOG_API_KEY unset (local development, tests, forks) every call is
 * a no-op.
 */

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined | string[]>;

type CaptureInput = {
  /** Account id of whoever did it. */
  distinctId: string;
  event: string;
  properties?: AnalyticsProperties;
};

const client =
  config.POSTHOG_API_KEY && config.NODE_ENV !== "test"
    ? new PostHog(config.POSTHOG_API_KEY, {
        host: config.POSTHOG_HOST,
        // Batches in the background; the request never waits on PostHog.
        flushAt: 20,
        flushInterval: 10_000,
      })
    : null;

client?.on("error", (error) => {
  logger.warn({ err: error }, "PostHog capture failed");
});

export const analytics = {
  enabled: client !== null,

  capture({ distinctId, event, properties }: CaptureInput) {
    client?.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        app: "api",
        environment: config.NODE_ENV,
      },
    });
  },

  /** Non-personal traits on the person (e.g. onboarded, has_projects). */
  setPersonProperties(distinctId: string, properties: AnalyticsProperties) {
    client?.capture({
      distinctId,
      event: "$set",
      properties: { $set: properties },
    });
  },

  /** Sends what is still queued. Call before the process exits. */
  async shutdown() {
    await client?.shutdown();
  },
};
