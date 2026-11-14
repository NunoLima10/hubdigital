const numberFormat = new Intl.NumberFormat("pt-PT");

export function formatCount(value: number) {
  return numberFormat.format(value);
}

/**
 * `YYYY-MM-DD` → "21 set". Parsed and formatted in UTC so the day never slips
 * by one for a viewer west of Greenwich; the string is a calendar day, not an
 * instant.
 */
export function formatDay(day: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(`${day}T00:00:00Z`))
    .replace(".", "");
}

export type Delta =
  | { kind: "none" }
  | { kind: "new" }
  | { kind: "change"; percent: number };

/**
 * How `current` compares with `previous`. A jump from zero has no meaningful
 * percentage, so it is reported as "new" rather than as infinity.
 */
export function computeDelta(current: number, previous: number): Delta {
  if (previous === 0) return current === 0 ? { kind: "none" } : { kind: "new" };

  return {
    kind: "change",
    percent: Math.round(((current - previous) / previous) * 100),
  };
}
