import { z } from "zod";

/**
 * What a visitor did with a project. `view` is a project page (or app screen)
 * being opened; `visit` is a click through to the project's own website.
 */
export const projectEventTypeValues = ["view", "visit"] as const;

export type ProjectEventType = (typeof projectEventTypeValues)[number];

/**
 * Which client reported the event. Kept per row so a maker can later see the
 * web/app split without a migration, and so the mobile app can report through
 * the same endpoint as the site.
 */
export const projectEventSourceValues = ["web", "app"] as const;

export type ProjectEventSource = (typeof projectEventSourceValues)[number];

export const projectEventBodySchema = z.object({
  type: z.enum(projectEventTypeValues),
  source: z.enum(projectEventSourceValues).default("web"),
});

export type ProjectEventBody = z.infer<typeof projectEventBodySchema>;

export const statsRangeValues = ["7d", "30d", "90d"] as const;

export type StatsRange = (typeof statsRangeValues)[number];

export const statsRangeDays: Record<StatsRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const statsCountersSchema = z.object({
  views: z.number(),
  visits: z.number(),
  upvotes: z.number(),
  comments: z.number(),
});

export const projectStatsSchema = z.object({
  range: z.enum(statsRangeValues),
  /** First and last day of the window, `YYYY-MM-DD`, in Cabo Verde local time. */
  from: z.string(),
  to: z.string(),
  totals: statsCountersSchema,
  /** The same counters for the equally long window right before this one. */
  previous: statsCountersSchema,
  /** One entry per day of the window, zero-filled. */
  series: z.array(
    z.object({
      day: z.string(),
      views: z.number(),
      visits: z.number(),
      upvotes: z.number(),
    })
  ),
});

export const projectStatsRowSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  status: z.string(),
  logoUrl: z.string().nullable(),
  views: z.number(),
  visits: z.number(),
  upvotes: z.number(),
  comments: z.number(),
});

/** Stats for every project the caller owns, plus one row per project. */
export const myProjectStatsSchema = projectStatsSchema.extend({
  projects: z.array(projectStatsRowSchema),
});

export type StatsCounters = z.infer<typeof statsCountersSchema>;
export type ProjectStats = z.infer<typeof projectStatsSchema>;
export type ProjectStatsRow = z.infer<typeof projectStatsRowSchema>;
export type MyProjectStats = z.infer<typeof myProjectStatsSchema>;
