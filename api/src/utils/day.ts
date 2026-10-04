import { CV_OFFSET_MS } from "./week";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calendar days in Cabo Verde local time, as `YYYY-MM-DD` strings.
 *
 * Strings rather than Dates because they compare correctly with `<`/`>=`,
 * round-trip through a Postgres `date` column untouched, and cannot pick up a
 * timezone by accident. The arithmetic goes through UTC midnight, which is safe
 * here because a day is always exactly 24 hours (no daylight saving).
 */
export type Day = string;

/** The local calendar day an instant falls in. */
export function toLocalDay(instant: Date = new Date()): Day {
  return new Date(instant.getTime() + CV_OFFSET_MS).toISOString().slice(0, 10);
}

export function shiftDay(day: Day, days: number): Day {
  const shifted = new Date(new Date(`${day}T00:00:00Z`).getTime() + days * DAY_MS);
  return shifted.toISOString().slice(0, 10);
}

/** Every day from `from` to `to`, both inclusive. */
export function eachDay(from: Day, to: Day): Day[] {
  const days: Day[] = [];

  for (let day = from; day <= to; day = shiftDay(day, 1)) {
    days.push(day);
  }

  return days;
}

/** The UTC instant at which a local day begins. */
export function startOfLocalDay(day: Day): Date {
  return new Date(new Date(`${day}T00:00:00Z`).getTime() - CV_OFFSET_MS);
}
