/**
 * `pending` and `rejected` only ever occur while the review gate is on — see
 * `moderation.review_required` in specs/ADMIN.md §A2. With it off a publish goes
 * straight from `draft` to `published`, exactly as before the gate existed.
 */
export const projectStatusValues = [
  "draft",
  "published",
  "pending",
  "rejected",
] as const;

export type ProjectStatus = (typeof projectStatusValues)[number];

/** The statuses a project can be in without ever having been made public. */
export const privateProjectStatusValues = [
  "draft",
  "pending",
  "rejected",
] as const;

/**
 * Which launch period a listing request wants. Calendar periods use Cabo Verde
 * time; `all` includes every launch.
 */
export const listPeriodValues = ["this_week", "this_month", "last_week", "all"] as const;

export type ListPeriod = (typeof listPeriodValues)[number];

export const listSortValues = ["upvotes", "newest"] as const;

export type ListSort = (typeof listSortValues)[number];

/** `YYYY-Www`, e.g. `2026-W35`. */
export const WEEK_ID_PATTERN = /^\d{4}-W\d{2}$/;
