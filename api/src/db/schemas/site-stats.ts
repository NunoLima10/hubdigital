import type { SiteStats } from "@hubdigital/shared";
import { date, jsonb, pgTable, timestamp } from "drizzle-orm/pg-core";

/**
 * Public site numbers (see modules/site-stats), copied from PostHog and served
 * from here. One row per Cabo Verde day: the last refresh of a day stays as
 * that day's snapshot, so the table doubles as history.
 *
 * The row also serves as the refresh lock. `refreshing_at` is claimed with a
 * conditional upsert, so of many requests (or API instances) that find the
 * numbers stale, one asks PostHog. A failed refresh leaves the claim in place
 * until it times out, which spaces out retries while PostHog is down.
 */
export const siteStatsSnapshots = pgTable("site_stats_snapshots", {
  day: date("day", { mode: "string" }).primaryKey(),
  /** Null only on a row claimed for a first refresh that has not landed. */
  payload: jsonb("payload").$type<SiteStats>(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true, mode: "date" }),
  refreshingAt: timestamp("refreshing_at", { withTimezone: true, mode: "date" }),
});
