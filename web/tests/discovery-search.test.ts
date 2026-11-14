import { describe, expect, it } from "vitest";
import { discoverySearchSchema } from "../src/modules/project-list/search-params";

describe("shareable discovery state", () => {
  it("restores all supported filters from a shared URL", () => {
    expect(
      discoverySearchSchema.parse({
        search: "true",
        q: "  mapa  ",
        island: "CV7",
        categoryId: "12",
        pricing: "free",
        availability: "public_beta",
        projectStage: "prototype",
        helpWanted: "marketing",
        period: "all",
      }),
    ).toEqual({
      search: true,
      q: "mapa",
      island: "CV7",
      categoryId: 12,
      pricing: "free",
      availability: "public_beta",
      projectStage: "prototype",
      helpWanted: "marketing",
      period: "all",
    });
  });
  it("ignores malformed filters rather than breaking the page", () => {
    const parsed = discoverySearchSchema.parse({
      q: "   ",
      island: "unknown",
      categoryId: "-1",
      availability: "oops",
      projectStage: "oops",
      helpWanted: "oops",
      period: "oops",
    });
    expect(
      Object.values(parsed).filter((value) => value !== undefined),
    ).toEqual([]);
  });
  it("keeps explicit false search state closed", () => {
    expect(discoverySearchSchema.parse({ search: "false" }).search).toBe(false);
    expect(discoverySearchSchema.parse({ search: "0" }).search).toBe(false);
    expect(discoverySearchSchema.parse({ search: "1" }).search).toBe(true);
    expect(
      discoverySearchSchema.parse({ search: "garbage" }).search,
    ).toBeUndefined();
  });
});
