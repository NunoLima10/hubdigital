const minuteInMilliseconds = 60_000;
const hourInMilliseconds = 60 * minuteInMilliseconds;
const dayInMilliseconds = 24 * hourInMilliseconds;

const relativeTime = new Intl.RelativeTimeFormat("pt-PT", {
  numeric: "always",
});

const exactDate = new Intl.DateTimeFormat("pt-CV", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function completedMonthsBetween(earlier: Date, later: Date) {
  let months =
    (later.getFullYear() - earlier.getFullYear()) * 12 +
    later.getMonth() -
    earlier.getMonth();
  const anniversaryDay = Math.min(
    earlier.getDate(),
    daysInMonth(later.getFullYear(), later.getMonth()),
  );
  const anniversary = new Date(
    later.getFullYear(),
    later.getMonth(),
    anniversaryDay,
    earlier.getHours(),
    earlier.getMinutes(),
    earlier.getSeconds(),
    earlier.getMilliseconds(),
  );

  if (later < anniversary) months -= 1;
  return Math.max(0, months);
}

function unitLabel(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function formatRelativeDate(value: string | Date, now = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const difference = date.getTime() - now.getTime();

  if (Number.isNaN(difference)) return "";

  const absoluteDifference = Math.abs(difference);
  if (absoluteDifference < minuteInMilliseconds) return "agora";

  const direction = difference < 0 ? -1 : 1;
  if (absoluteDifference < hourInMilliseconds) {
    return relativeTime.format(
      direction * Math.floor(absoluteDifference / minuteInMilliseconds),
      "minute",
    );
  }
  if (absoluteDifference < dayInMilliseconds) {
    return relativeTime.format(
      direction * Math.floor(absoluteDifference / hourInMilliseconds),
      "hour",
    );
  }

  const earlier = difference < 0 ? date : now;
  const later = difference < 0 ? now : date;
  const completedMonths = completedMonthsBetween(earlier, later);

  if (completedMonths >= 12) {
    const years = Math.floor(completedMonths / 12);
    const remainingMonths = completedMonths % 12;
    if (remainingMonths === 0) {
      return relativeTime.format(direction * years, "year");
    }

    const duration = `${unitLabel(years, "ano", "anos")} e ${unitLabel(remainingMonths, "mês", "meses")}`;
    return direction < 0 ? `há ${duration}` : `dentro de ${duration}`;
  }
  if (completedMonths >= 1) {
    return relativeTime.format(direction * completedMonths, "month");
  }

  const completedDays = Math.floor(absoluteDifference / dayInMilliseconds);
  if (completedDays < 7) {
    return relativeTime.format(direction * completedDays, "day");
  }
  return relativeTime.format(direction * Math.floor(completedDays / 7), "week");
}

export function formatExactDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : exactDate.format(date);
}
