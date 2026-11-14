const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const formatter = new Intl.RelativeTimeFormat("pt", { numeric: "auto" });

/** "há 5 minutos", "ontem" — falls back to a plain date past a month. */
export function relativeTime(iso: string) {
  const seconds = Math.round((Date.parse(iso) - Date.now()) / 1000);
  const magnitude = Math.abs(seconds);

  if (magnitude < MINUTE) return "agora mesmo";
  if (magnitude < HOUR) {
    return formatter.format(Math.round(seconds / MINUTE), "minute");
  }
  if (magnitude < DAY) {
    return formatter.format(Math.round(seconds / HOUR), "hour");
  }
  if (magnitude < 30 * DAY) {
    return formatter.format(Math.round(seconds / DAY), "day");
  }

  return new Date(iso).toLocaleDateString("pt", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
