import type { DB } from "@/db";
import { siteStatsSnapshots } from "@/db/schemas";
import { posthogQueryEnabled, runHogQL } from "@/lib/posthog-query";
import { toLocalDay } from "@/utils/day";
import { logger } from "@/utils/logger";
import type { SiteStats } from "@hubdigital/shared";
import { and, desc, eq, isNotNull, isNull, lt, or } from "drizzle-orm";

/**
 * Site-wide numbers for the home sidebar: this year so far and since the
 * first counted pageview. PostHog is the source, but visitors are always
 * served from our database (site_stats_snapshots):
 *
 * - Fresh snapshot (younger than REFRESH_INTERVAL_MS): served as is.
 * - Stale: still served at once, and one request — whichever wins the claim
 *   on today's row — refreshes it from PostHog in the background.
 * - None yet (first run): that one request waits for PostHog.
 *
 * So PostHog is asked about once per interval, whatever the traffic or the
 * number of API instances, and a PostHog outage or a deploy never empties the
 * card. A short in-process memo spares the database a read per home visit.
 */
export const REFRESH_INTERVAL_MS = 5 * 60_000;
/** A claim older than this is presumed dead (crash, timeout) and retaken. */
const CLAIM_TIMEOUT_MS = 5 * 60_000;
const MEMO_TTL_MS = 60_000;

let memo: { value: SiteStats | null; expiresAt: number } | null = null;
let backgroundRefresh: Promise<unknown> | null = null;

type StatsRow = {
  year: number;
  year_visitors: number;
  year_pageviews: number;
  year_home_views: number;
  all_visitors: number;
  all_pageviews: number;
  all_home_views: number;
  since: string | null;
};

// One pass over $pageview answers both periods. The all-time half reads the
// whole history; cheap at this size and at one query every five minutes.
// Each environment has its own PostHog project, so every pageview counts.
const STATS_QUERY = `
  SELECT
    toYear(now()) AS year,
    uniqExactIf(person_id, timestamp >= toStartOfYear(now())) AS year_visitors,
    countIf(timestamp >= toStartOfYear(now())) AS year_pageviews,
    countIf(properties.$pathname = '/' AND timestamp >= toStartOfYear(now())) AS year_home_views,
    uniqExact(person_id) AS all_visitors,
    count() AS all_pageviews,
    countIf(properties.$pathname = '/') AS all_home_views,
    min(timestamp) AS since
  FROM events
  WHERE event = '$pageview'
`;

const toCount = (value: unknown) => Number(value ?? 0) || 0;

async function fetchFromPostHog(): Promise<SiteStats> {
  const [row] = await runHogQL<StatsRow>("site-stats", STATS_QUERY);
  const allPageviews = toCount(row?.all_pageviews);

  return {
    year: toCount(row?.year) || new Date().getUTCFullYear(),
    yearToDate: {
      visitors: toCount(row?.year_visitors),
      pageviews: toCount(row?.year_pageviews),
      homeViews: toCount(row?.year_home_views),
    },
    allTime: {
      visitors: toCount(row?.all_visitors),
      pageviews: allPageviews,
      homeViews: toCount(row?.all_home_views),
      // min() over no rows is the epoch, not null.
      since: allPageviews > 0 && row?.since ? new Date(row.since).toISOString() : null,
    },
    updatedAt: new Date().toISOString(),
  };
}

async function latestSnapshot(db: DB) {
  const [row] = await db
    .select({ payload: siteStatsSnapshots.payload, fetchedAt: siteStatsSnapshots.fetchedAt })
    .from(siteStatsSnapshots)
    .where(isNotNull(siteStatsSnapshots.payload))
    .orderBy(desc(siteStatsSnapshots.day))
    .limit(1);
  return row?.payload && row.fetchedAt ? { payload: row.payload, fetchedAt: row.fetchedAt } : null;
}

/**
 * Claims today's row for a refresh. True for exactly one caller while the
 * numbers are stale; false when another refresh is under way or just landed.
 */
async function claimRefresh(db: DB, day: string): Promise<boolean> {
  const now = new Date();
  const claimed = await db
    .insert(siteStatsSnapshots)
    .values({ day, refreshingAt: now })
    .onConflictDoUpdate({
      target: siteStatsSnapshots.day,
      set: { refreshingAt: now },
      setWhere: and(
        or(
          isNull(siteStatsSnapshots.refreshingAt),
          lt(siteStatsSnapshots.refreshingAt, new Date(now.getTime() - CLAIM_TIMEOUT_MS)),
        ),
        or(
          isNull(siteStatsSnapshots.fetchedAt),
          lt(siteStatsSnapshots.fetchedAt, new Date(now.getTime() - REFRESH_INTERVAL_MS)),
        ),
      ),
    })
    .returning({ day: siteStatsSnapshots.day });
  return claimed.length > 0;
}

/**
 * Asks PostHog and stores the answer in today's row, releasing the claim. On
 * failure the claim stays until it times out, so retries are spaced out.
 */
async function refresh(db: DB, day: string): Promise<SiteStats | null> {
  try {
    const payload = await fetchFromPostHog();
    await db
      .update(siteStatsSnapshots)
      .set({ payload, fetchedAt: new Date(), refreshingAt: null })
      .where(eq(siteStatsSnapshots.day, day));
    memo = { value: payload, expiresAt: Date.now() + MEMO_TTL_MS };
    return payload;
  } catch (error) {
    logger.warn({ err: error }, "Site stats refresh failed");
    return null;
  }
}

async function load(db: DB): Promise<SiteStats | null> {
  const snapshot = await latestSnapshot(db);
  const fresh =
    snapshot && Date.now() - snapshot.fetchedAt.getTime() < REFRESH_INTERVAL_MS;
  if (fresh) return snapshot.payload;

  const day = toLocalDay();
  if (!(await claimRefresh(db, day))) return snapshot?.payload ?? null;

  if (!snapshot) return refresh(db, day);

  backgroundRefresh = refresh(db, day).finally(() => {
    backgroundRefresh = null;
  });
  return snapshot.payload;
}

export const SiteStatsService = {
  /** null when PostHog is not configured or has never answered. */
  async get(db: DB): Promise<SiteStats | null> {
    if (!posthogQueryEnabled) return null;
    if (memo && memo.expiresAt > Date.now()) return memo.value;

    const value = await load(db);
    memo = { value, expiresAt: Date.now() + MEMO_TTL_MS };
    return value;
  },

  /** For tests: forget the memo and wait out any background refresh. */
  async settle() {
    await backgroundRefresh;
    memo = null;
  },
};
