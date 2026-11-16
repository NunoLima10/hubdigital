import {
  projectBadgeCatalog,
  projectBadgeKeyValues,
  type ProjectBadgeKey,
  type UnseenProjectBadge,
} from "@hubdigital/shared";

/** A believable award for each plaque, on a made-up project (previews only). */
export function sampleProjectBadgeAward(key: ProjectBadgeKey): UnseenProjectBadge {
  const period = projectBadgeCatalog[key].period;
  return {
    id: projectBadgeKeyValues.indexOf(key) + 1,
    key,
    period: period === "week" ? "2026-W46" : period === "month" ? "2026-11" : null,
    rank: key === "weekly-top-1" ? 1 : key === "weekly-top-3" ? 2 : key === "weekly-top-10" ? 7 : key === "pioneer" ? 12 : null,
    awardedAt: new Date().toISOString(),
    project: { id: 1, slug: "morabeza-maps", name: "Morabeza Maps", logoUrl: null },
  };
}
