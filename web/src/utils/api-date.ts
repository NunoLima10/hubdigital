/**
 * Parses a timestamp as the API sends it: Postgres text such as
 * "2026-10-11 22:07:11.045+00", which is not ISO 8601 and which only some
 * engines accept as-is. Returns null for anything unparseable.
 */
export function parseApiDate(value: string | null | undefined) {
  if (!value) return null;
  const iso = value.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00");
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}
