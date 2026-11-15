import { z } from "zod";

/**
 * Public, site-wide numbers for the home sidebar, read from PostHog by the
 * API (GET /v1/site-stats). See specs/analytics-events.md.
 */
export const siteStatsTotalsSchema = z.object({
  /** Unique visitors across the whole site. */
  visitors: z.number().int().nonnegative(),
  /** Pageviews across the whole site. */
  pageviews: z.number().int().nonnegative(),
  /** Pageviews of the home page ("/"). */
  homeViews: z.number().int().nonnegative(),
});

export type SiteStatsTotals = z.infer<typeof siteStatsTotalsSchema>;

export const siteStatsSchema = z.object({
  /** The calendar year `yearToDate` covers (UTC). */
  year: z.number().int(),
  yearToDate: siteStatsTotalsSchema,
  allTime: siteStatsTotalsSchema.extend({
    /** First counted pageview (ISO), or null before there is any. */
    since: z.string().nullable(),
  }),
  /** When PostHog was last asked (ISO). Numbers are cached for minutes. */
  updatedAt: z.string(),
});

export type SiteStats = z.infer<typeof siteStatsSchema>;
