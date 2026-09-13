import { describe, expect, it } from "vitest";
import "../setup-env";
import { currentWeek, previousWeek, toWeekId, weekFromId } from "@/utils/week";

// Cabo Verde is UTC-1, so a local Monday 00:00 is 01:00 UTC the same day.
describe("week helpers", () => {
  it("names the ISO week a date falls in", () => {
    expect(toWeekId(new Date("2026-08-29T12:00:00Z"))).toBe("2026-W35");
  });

  it("keeps late Sunday evening in the week that is ending", () => {
    // 2026-08-30 is a Sunday. 23:30 UTC is 22:30 in Cabo Verde, still Sunday.
    expect(toWeekId(new Date("2026-08-30T23:30:00Z"))).toBe("2026-W35");
  });

  it("rolls over at Cape Verdean midnight, not UTC midnight", () => {
    // 2026-08-31T00:30Z is 2026-08-30 23:30 locally — still the old week.
    expect(toWeekId(new Date("2026-08-31T00:30:00Z"))).toBe("2026-W35");
    // 2026-08-31T01:30Z is 2026-08-31 00:30 locally — the new week has started.
    expect(toWeekId(new Date("2026-08-31T01:30:00Z"))).toBe("2026-W36");
  });

  it("returns a half-open range one week long", () => {
    const week = currentWeek(new Date("2026-08-29T12:00:00Z"));

    expect(week.weekId).toBe("2026-W35");
    expect(week.start.toISOString()).toBe("2026-08-24T01:00:00.000Z");
    expect(week.end.toISOString()).toBe("2026-08-31T01:00:00.000Z");
  });

  it("walks back exactly one week", () => {
    const week = previousWeek(new Date("2026-08-29T12:00:00Z"));

    expect(week.weekId).toBe("2026-W34");
    expect(week.end.toISOString()).toBe(
      currentWeek(new Date("2026-08-29T12:00:00Z")).start.toISOString()
    );
  });

  it("round-trips a week id", () => {
    const week = weekFromId("2026-W35");

    expect(week).not.toBeNull();
    expect(week!.start.toISOString()).toBe("2026-08-24T01:00:00.000Z");
    expect(toWeekId(week!.start)).toBe("2026-W35");
  });

  it("handles the first week of a year that starts mid-week", () => {
    // 2026-01-01 is a Thursday, so it belongs to 2026-W01.
    expect(toWeekId(new Date("2026-01-01T12:00:00Z"))).toBe("2026-W01");
    // 2025-12-29 is the Monday that starts that same ISO week.
    expect(weekFromId("2026-W01")!.start.toISOString()).toBe(
      "2025-12-29T01:00:00.000Z"
    );
  });

  it("assigns early January days to the previous ISO year when they belong there", () => {
    // 2027-01-01 is a Friday; that week started Monday 2026-12-28, so it is
    // 2026-W53.
    expect(toWeekId(new Date("2027-01-01T12:00:00Z"))).toBe("2026-W53");
  });

  it("rejects malformed and non-existent week ids", () => {
    expect(weekFromId("nonsense")).toBeNull();
    expect(weekFromId("2026-W99")).toBeNull();
    // 2025 has 52 ISO weeks, so W53 must not silently resolve to 2026-W01.
    expect(weekFromId("2025-W53")).toBeNull();
  });
});
