import { config } from "@/config";

/**
 * Minimal client for PostHog's query API (POST /api/projects/:id/query/).
 * Reads only; writes go through posthog-node (src/lib/analytics.ts).
 *
 * Queries with a personal key draw from an hourly read budget per project and
 * return 429 once it runs out, so callers must cache (see site-stats).
 */

const QUERY_TIMEOUT_MS = 8_000;

export const posthogQueryEnabled = Boolean(
  config.POSTHOG_PERSONAL_API_KEY && config.POSTHOG_PROJECT_ID,
);

export class PostHogQueryError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "PostHogQueryError";
  }
}

type HogQLResponse = {
  columns?: string[];
  results?: unknown[][];
};

/**
 * Runs a HogQL query and returns its rows as objects keyed by column name.
 * Pass user- or config-supplied values through `values` ({name} placeholders),
 * never by string interpolation.
 */
export async function runHogQL<Row extends Record<string, unknown>>(
  name: string,
  query: string,
  values: Record<string, string | number> = {},
): Promise<Row[]> {
  if (!posthogQueryEnabled) {
    throw new PostHogQueryError("PostHog query API is not configured");
  }

  const url = new URL(
    `/api/projects/${encodeURIComponent(config.POSTHOG_PROJECT_ID!)}/query/`,
    config.POSTHOG_APP_HOST,
  );

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.POSTHOG_PERSONAL_API_KEY}`,
      },
      // `name` labels the query in PostHog's query_log.
      body: JSON.stringify({ query: { kind: "HogQLQuery", query, values }, name }),
      signal: AbortSignal.timeout(QUERY_TIMEOUT_MS),
    });
  } catch (error) {
    throw new PostHogQueryError(`PostHog query "${name}" failed: ${String(error)}`);
  }

  if (!response.ok) {
    throw new PostHogQueryError(
      `PostHog query "${name}" returned ${response.status}`,
      response.status,
    );
  }

  const body = (await response.json()) as HogQLResponse;
  const columns = body.columns ?? [];
  return (body.results ?? []).map(
    (row) => Object.fromEntries(columns.map((column, i) => [column, row[i]])) as Row,
  );
}
