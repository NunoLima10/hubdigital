import { initialProjectValues } from "@/modules/submit/context/initial-project-values";
import { getSubmissionQuality } from "@/modules/submit/utils/quality-score";
import { submissionQualityScoreColor } from "@/modules/submit/ui/components/submission-quality-score";
import { describe, expect, it } from "vitest";

describe("submission quality score", () => {
  it("starts at zero and reaches ten without blocking optional guidance", () => {
    expect(getSubmissionQuality(initialProjectValues, false).score).toBe(0);

    const complete = {
      ...initialProjectValues,
      name: "Nha Projeto",
      shortDescription: "Uma solução útil criada para a comunidade cabo-verdiana.",
      description:
        "<p>Este projeto resolve um problema concreto, explica a solução e mostra como a comunidade pode participar e beneficiar.</p>",
      projectStage: "live" as const,
      availability: "available" as const,
      links: [
        {
          kind: "website" as const,
          url: "https://example.cv",
          label: "",
          isPrimary: true,
          referralAttribution: false,
        },
      ],
      categoryId: 1,
      aiInvolvement: "supporting" as const,
      galleryImageKeys: ["project/demo.webp"],
      helpWanted: ["feedback" as const],
    };

    const quality = getSubmissionQuality(complete, true);
    expect(quality.score).toBe(10);
    expect(quality.required.every((item) => item.complete)).toBe(true);
  });

  it("weights publication essentials more heavily than recommendations", () => {
    const essentials = {
      ...initialProjectValues,
      name: "Nha Projeto",
      shortDescription: "Uma solução útil para a comunidade.",
      projectStage: "idea" as const,
      availability: "not_available" as const,
      categoryId: 1,
      aiInvolvement: "none" as const,
    };

    expect(getSubmissionQuality(essentials, false).score).toBe(6);
  });

  it("uses distinct colors for empty, weak, good, and complete submissions", () => {
    expect(submissionQualityScoreColor(0)).toBe("text-foreground");
    expect(submissionQualityScoreColor(3)).toContain("text-destructive");
    expect(submissionQualityScoreColor(7)).toContain("text-orange");
    expect(submissionQualityScoreColor(8)).toContain("text-teal");
    expect(submissionQualityScoreColor(9)).toContain("text-teal");
    expect(submissionQualityScoreColor(10)).toContain("text-emerald");
  });
});
