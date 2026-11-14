import {
  formatExactDate,
  formatRelativeDate,
} from "@/modules/project-detail/utils/relative-date";
import { describe, expect, it } from "vitest";

describe("project relative dates", () => {
  const now = new Date(2026, 2, 16, 12, 0, 0);

  it.each([
    [new Date(2026, 2, 16, 11, 59, 30), "agora"],
    [new Date(2026, 2, 16, 11, 55, 0), "há 5 minutos"],
    [new Date(2026, 2, 16, 9, 0, 0), "há 3 horas"],
    [new Date(2026, 2, 13, 12, 0, 0), "há 3 dias"],
    [new Date(2026, 2, 2, 12, 0, 0), "há 2 semanas"],
  ])("formats recent activity at useful intervals", (date, expected) => {
    expect(formatRelativeDate(date, now)).toBe(expected);
  });

  it("uses completed calendar months instead of converting months to days", () => {
    expect(formatRelativeDate(new Date(2026, 0, 31, 12, 0, 0), now)).toBe(
      "há 1 mês",
    );
  });

  it("keeps the remaining months when the date is more than a year old", () => {
    expect(formatRelativeDate(new Date(2025, 0, 16, 12, 0, 0), now)).toBe(
      "há 1 ano e 2 meses",
    );
  });

  it("retains an exact numeric date for the hover tooltip", () => {
    expect(formatExactDate(new Date(2026, 8, 8, 12, 0, 0))).toBe("08/09/2026");
  });
});
