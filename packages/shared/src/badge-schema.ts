import { z } from "zod";

/**
 * The badge catalog. Code is the source of truth: every badge is declared
 * here, and the API seeds the `badges` table from this list so awards can
 * reference it with a foreign key. Adding a badge is one entry here, its art
 * in the web `BadgeMedal`, and a seed run.
 */
export const badgeKeyValues = [
  "founder",
  "founding-gold",
  "founding-silver",
  "founding-basalt",
  "maintainer",
] as const;

export type BadgeKey = (typeof badgeKeyValues)[number];

/**
 * `automatic` badges are earned by a rule the API applies (for example the
 * order in which someone joined); `manual` ones are only granted by staff in
 * the admin.
 */
export const badgeAwardModeValues = ["automatic", "manual"] as const;

export type BadgeAwardMode = (typeof badgeAwardModeValues)[number];

export type BadgeDefinition = {
  key: BadgeKey;
  name: string;
  /** Material or theme, shown under the name. */
  material: string;
  description: string;
  awardMode: BadgeAwardMode;
  /** Lower comes first wherever badges are listed. */
  sortOrder: number;
};

export const badgeCatalog: Record<BadgeKey, BadgeDefinition> = {
  founder: {
    key: "founder",
    name: "Fundador",
    material: "Diamante",
    description: "Uma peça única para quem fundou o Hub Digital.",
    awardMode: "manual",
    sortOrder: 10,
  },
  maintainer: {
    key: "maintainer",
    name: "Maintainer",
    material: "Esmeralda",
    description: "Mantém o código aberto do Hub Digital.",
    awardMode: "manual",
    sortOrder: 20,
  },
  "founding-gold": {
    key: "founding-gold",
    name: "Primeiros 10",
    material: "Ouro",
    description: "O primeiro círculo de pessoas que acreditou no Hub.",
    awardMode: "automatic",
    sortOrder: 30,
  },
  "founding-silver": {
    key: "founding-silver",
    name: "Primeiros 50",
    material: "Prata",
    description: "A comunidade inicial enquanto ainda era pequena.",
    awardMode: "automatic",
    sortOrder: 40,
  },
  "founding-basalt": {
    key: "founding-basalt",
    name: "Primeiros 100",
    material: "Basalto vulcânico",
    description: "Uma base sólida, inspirada na paisagem de Cabo Verde.",
    awardMode: "automatic",
    sortOrder: 50,
  },
};

export const badgeDefinitions = Object.values(badgeCatalog).sort(
  (a, b) => a.sortOrder - b.sortOrder,
);

export const manualBadgeKeys = badgeDefinitions
  .filter((badge) => badge.awardMode === "manual")
  .map((badge) => badge.key);

/**
 * The founding-member badge someone earns for the order in which they joined.
 * Member #1 earns none automatically: the diamond `founder` badge is granted
 * by staff.
 */
export function foundingBadgeFor(membershipNumber: number): BadgeKey | null {
  if (membershipNumber < 2) return null;
  if (membershipNumber <= 10) return "founding-gold";
  if (membershipNumber <= 50) return "founding-silver";
  if (membershipNumber <= 100) return "founding-basalt";
  return null;
}

export const badgeKeySchema = z.enum(badgeKeyValues);

export const awardedBadgeSchema = z.object({
  key: badgeKeySchema,
  awardedAt: z.string(),
});

export const myBadgeSchema = awardedBadgeSchema.extend({
  /** The one badge shown next to the user's name across the site. */
  featured: z.boolean(),
  /** Null until the "you earned a badge" moment has been shown. */
  seenAt: z.string().nullable(),
});

export const featureBadgeBodySchema = z.object({
  /** Null hides every badge from the profile and comments. */
  key: badgeKeySchema.nullable(),
});

export const markBadgesSeenBodySchema = z.object({
  keys: z.array(badgeKeySchema).min(1).max(badgeKeyValues.length),
});

export const grantBadgeBodySchema = z.object({
  key: badgeKeySchema,
});

export type AwardedBadge = z.infer<typeof awardedBadgeSchema>;
export type MyBadge = z.infer<typeof myBadgeSchema>;
