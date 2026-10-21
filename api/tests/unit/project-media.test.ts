import { projectBodySchema } from "@hubdigital/shared";
import { describe, expect, it } from "vitest";

const validProject = {
  name: "Hub Digital",
  shortDescription: "Uma plataforma para descobrir projetos digitais",
  links: [{ kind: "website", url: "https://hubdigital.cv", isPrimary: true }],
  pricing: "free",
  platform: ["web"],
  businessModel: "b2c",
  availability: "not_available",
  projectStage: "prototype",
  audiences: ["general_public"],
  location: { country: "cv", island: "CV2" },
  categoryId: 1,
  galleryImageKeys: ["project_gallery/one.png"],
} as const;

describe("project media contract", () => {
  it("accepts zero to ten ordered gallery images", () => {
    expect(projectBodySchema.safeParse(validProject).success).toBe(true);
    expect(
      projectBodySchema.safeParse({ ...validProject, galleryImageKeys: [] }).success,
    ).toBe(true);
    const { galleryImageKeys: _galleryImageKeys, ...withoutGallery } = validProject;
    const parsed = projectBodySchema.safeParse(withoutGallery);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.galleryImageKeys).toEqual([]);
    expect(
      projectBodySchema.safeParse({
        ...validProject,
        galleryImageKeys: Array.from(
          { length: 10 },
          (_, index) => `project_gallery/${index}.png`,
        ),
      }).success,
    ).toBe(true);
  });

  it("rejects more than ten images and duplicate keys", () => {
    expect(
      projectBodySchema.safeParse({
        ...validProject,
        galleryImageKeys: Array.from(
          { length: 11 },
          (_, index) => `project_gallery/${index}.png`,
        ),
      }).success,
    ).toBe(false);
    expect(
      projectBodySchema.safeParse({
        ...validProject,
        galleryImageKeys: ["project_gallery/same.png", "project_gallery/same.png"],
      }).success,
    ).toBe(false);
  });

  it("rejects gallery keys from another upload namespace", () => {
    expect(
      projectBodySchema.safeParse({
        ...validProject,
        galleryImageKeys: ["project_logo/not-a-gallery.png"],
      }).success,
    ).toBe(false);
  });
});
