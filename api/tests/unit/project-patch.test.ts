import { describe, expect, it } from "vitest";
import { updateProjectDraftSchema } from "@hubdigital/shared";

describe("partial project updates", () => {
  it("does not reset omitted fields to creation defaults", () => {
    expect(updateProjectDraftSchema.parse({ name: "New name" })).toEqual({ name: "New name" });
    expect(updateProjectDraftSchema.parse({})).toEqual({});
  });
  it("keeps explicit empty arrays and validates supplied values", () => {
    expect(updateProjectDraftSchema.parse({ links: [], secondaryCategoryIds: [] })).toEqual({ links: [], secondaryCategoryIds: [] });
    expect(updateProjectDraftSchema.safeParse({ platform: ["invalid"] }).success).toBe(false);
  });
});
