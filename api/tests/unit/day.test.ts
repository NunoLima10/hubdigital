import { describe, expect, it } from "vitest";
import "../setup-env";
import { eachDay, shiftDay, startOfLocalDay, toLocalDay } from "@/utils/day";

// Cabo Verde is UTC-1 all year, so local midnight is 01:00 UTC.
describe("day helpers", () => {
  it("names the local day an instant falls in", () => {
    expect(toLocalDay(new Date("2026-08-29T12:00:00Z"))).toBe("2026-08-29");
  });

  it("keeps the last local hour of a day in that day", () => {
    // 00:30 UTC on the 30th is 23:30 on the 29th locally.
    expect(toLocalDay(new Date("2026-08-30T00:30:00Z"))).toBe("2026-08-29");
    expect(toLocalDay(new Date("2026-08-30T01:00:00Z"))).toBe("2026-08-30");
  });

  it("shifts across month and year boundaries", () => {
    expect(shiftDay("2026-08-31", 1)).toBe("2026-09-01");
    expect(shiftDay("2026-01-01", -1)).toBe("2025-12-31");
    expect(shiftDay("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("lists every day of a range, inclusive at both ends", () => {
    expect(eachDay("2026-08-30", "2026-09-02")).toEqual([
      "2026-08-30",
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
    ]);
    expect(eachDay("2026-08-30", "2026-08-30")).toEqual(["2026-08-30"]);
  });

  it("finds the UTC instant a local day begins", () => {
    expect(startOfLocalDay("2026-08-30").toISOString()).toBe(
      "2026-08-30T01:00:00.000Z"
    );
  });
});
