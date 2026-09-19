/**
 * Weekly launch cycle helpers.
 *
 * Cabo Verde sits at UTC-1 year round with no daylight saving, so a fixed offset
 * is enough — no timezone database needed. Weeks are ISO weeks: Monday 00:00
 * through Sunday 23:59:59.999, in Cape Verdean local time.
 */

const CV_OFFSET_MS = -60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

export type WeekRange = {
  weekId: string;
  /** Inclusive start of the week, as a UTC instant. */
  start: Date;
  /** Exclusive end of the week, as a UTC instant. */
  end: Date;
};

/**
 * Shifts a UTC instant into a Date whose *UTC fields* read as Cape Verdean wall
 * clock time, so the date arithmetic below can ignore timezones entirely.
 */
function toLocalFields(instant: Date) {
  return new Date(instant.getTime() + CV_OFFSET_MS);
}

function fromLocalFields(local: Date) {
  return new Date(local.getTime() - CV_OFFSET_MS);
}

/** Days since Monday, 0-6. */
function isoDayIndex(local: Date) {
  return (local.getUTCDay() + 6) % 7;
}

function startOfIsoWeek(local: Date) {
  const midnight = new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate())
  );
  midnight.setUTCDate(midnight.getUTCDate() - isoDayIndex(midnight));
  return midnight;
}

function mondayOfIsoWeekOne(isoYear: number) {
  // ISO week 1 is the week containing January 4th.
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  return startOfIsoWeek(jan4);
}

export function toWeekId(instant: Date = new Date()): string {
  const weekStart = startOfIsoWeek(toLocalFields(instant));

  // The ISO year is the year of that week's Thursday.
  const thursday = new Date(weekStart.getTime() + 3 * DAY_MS);
  const isoYear = thursday.getUTCFullYear();

  const weekOne = mondayOfIsoWeekOne(isoYear);
  const week = Math.round((weekStart.getTime() - weekOne.getTime()) / WEEK_MS) + 1;

  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

function rangeFromLocalWeekStart(weekStart: Date): WeekRange {
  const start = fromLocalFields(weekStart);
  const end = new Date(start.getTime() + WEEK_MS);

  return { weekId: toWeekId(start), start, end };
}

/** The week that contains `instant` (defaults to now). */
export function currentWeek(instant: Date = new Date()): WeekRange {
  return rangeFromLocalWeekStart(startOfIsoWeek(toLocalFields(instant)));
}

/** The week immediately before the one containing `instant`. */
export function previousWeek(instant: Date = new Date()): WeekRange {
  const weekStart = startOfIsoWeek(toLocalFields(instant));
  return rangeFromLocalWeekStart(new Date(weekStart.getTime() - WEEK_MS));
}

/**
 * Resolves a `YYYY-Www` identifier into its range, or null when the identifier
 * doesn't name a real ISO week (week 53 does not exist in every year).
 */
export function weekFromId(weekId: string): WeekRange | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekId);
  if (!match) return null;

  const isoYear = Number(match[1]);
  const week = Number(match[2]);
  if (week < 1 || week > 53) return null;

  const weekStart = new Date(
    mondayOfIsoWeekOne(isoYear).getTime() + (week - 1) * WEEK_MS
  );

  const range = rangeFromLocalWeekStart(weekStart);

  // Week 53 of a 52-week year rolls into the next year; reject rather than
  // silently answering for a different week than the caller asked for.
  return range.weekId === weekId ? range : null;
}
