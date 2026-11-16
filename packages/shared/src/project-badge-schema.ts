import { z } from "zod";

/**
 * Project achievements ("conquistas"). They are the project's own record and
 * only appear on the project page and in the admin, never next to a person.
 * The catalog lives here, in code; awards live in `project_badge_awards`. The
 * art is the web `ProjectPlaque`, keyed by the same strings.
 */
export const projectBadgeKeyValues = [
  "weekly-top-1",
  "weekly-top-3",
  "weekly-top-10",
  "upvotes-10",
  "upvotes-50",
  "upvotes-100",
  "upvotes-500",
  "staff-pick",
  "project-of-month",
  "pioneer",
] as const;

export type ProjectBadgeKey = (typeof projectBadgeKeyValues)[number];

/**
 * What an award is tied to: one ISO week (`2026-W46`), one calendar month
 * (`2026-11`), or nothing for a badge a project earns once.
 */
export type ProjectBadgePeriodKind = "week" | "month" | null;

export type ProjectBadgeDefinition = {
  key: ProjectBadgeKey;
  name: string;
  description: string;
  /** Automatic badges follow a rule the API applies; manual ones are granted by staff. */
  awardMode: "automatic" | "manual";
  period: ProjectBadgePeriodKind;
  /** Lower comes first on the project page. */
  sortOrder: number;
};

/** Fewest upvotes a project needs at the weekly close to earn a ranking plaque. */
export const WEEKLY_BADGE_MIN_UPVOTES = 5;

/** The first projects published on the Hub earn the pioneer plaque, numbered. */
export const PIONEER_PROJECT_LIMIT = 100;

export const upvoteMilestones = [
  { key: "upvotes-10", threshold: 10 },
  { key: "upvotes-50", threshold: 50 },
  { key: "upvotes-100", threshold: 100 },
  { key: "upvotes-500", threshold: 500 },
] as const satisfies readonly { key: ProjectBadgeKey; threshold: number }[];

export const projectBadgeCatalog: Record<ProjectBadgeKey, ProjectBadgeDefinition> = {
  "weekly-top-1": {
    key: "weekly-top-1",
    name: "1º da semana",
    description: "Primeiro lugar no fecho do ranking semanal.",
    awardMode: "automatic",
    period: "week",
    sortOrder: 10,
  },
  "project-of-month": {
    key: "project-of-month",
    name: "Projeto do mês",
    description: "Escolhido pela equipa como o projeto do mês.",
    awardMode: "manual",
    period: "month",
    sortOrder: 20,
  },
  "staff-pick": {
    key: "staff-pick",
    name: "Escolha da equipa",
    description: "Destacado pela equipa do Hub Digital.",
    awardMode: "manual",
    period: null,
    sortOrder: 30,
  },
  "weekly-top-3": {
    key: "weekly-top-3",
    name: "Top 3 da semana",
    description: "2º ou 3º lugar no fecho do ranking semanal.",
    awardMode: "automatic",
    period: "week",
    sortOrder: 40,
  },
  "weekly-top-10": {
    key: "weekly-top-10",
    name: "Top 10 da semana",
    description: "Do 4º ao 10º lugar no fecho do ranking semanal.",
    awardMode: "automatic",
    period: "week",
    sortOrder: 50,
  },
  "upvotes-500": {
    key: "upvotes-500",
    name: "500 apoios",
    description: "Chegou aos 500 apoios.",
    awardMode: "automatic",
    period: null,
    sortOrder: 60,
  },
  "upvotes-100": {
    key: "upvotes-100",
    name: "100 apoios",
    description: "Chegou aos 100 apoios.",
    awardMode: "automatic",
    period: null,
    sortOrder: 70,
  },
  "upvotes-50": {
    key: "upvotes-50",
    name: "50 apoios",
    description: "Chegou aos 50 apoios.",
    awardMode: "automatic",
    period: null,
    sortOrder: 80,
  },
  "upvotes-10": {
    key: "upvotes-10",
    name: "10 apoios",
    description: "Chegou aos primeiros 10 apoios.",
    awardMode: "automatic",
    period: null,
    sortOrder: 90,
  },
  pioneer: {
    key: "pioneer",
    name: "Pioneiro",
    description: `Um dos primeiros ${PIONEER_PROJECT_LIMIT} projetos publicados no Hub Digital.`,
    awardMode: "automatic",
    period: null,
    sortOrder: 100,
  },
};

export const manualProjectBadgeKeys = projectBadgeKeyValues.filter(
  (key) => projectBadgeCatalog[key].awardMode === "manual",
);

/** The weekly plaque for a closing place, or null outside the top 10. */
export function weeklyBadgeFor(rank: number): ProjectBadgeKey | null {
  if (rank === 1) return "weekly-top-1";
  if (rank <= 3) return "weekly-top-3";
  if (rank <= 10) return "weekly-top-10";
  return null;
}

export const projectBadgeKeySchema = z.enum(projectBadgeKeyValues);

export const projectBadgeMonthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Usa o formato AAAA-MM.");

export const projectBadgeAwardSchema = z.object({
  id: z.number(),
  key: projectBadgeKeySchema,
  /** `2026-W46` for weekly plaques, `2026-11` for project of the month. */
  period: z.string().nullable(),
  /** The closing place for weekly plaques; the launch order for pioneer. */
  rank: z.number().int().nullable(),
  awardedAt: z.string(),
});

export const bestWeeklyRankSchema = z.object({
  rank: z.number().int().positive(),
  /** The first week the project closed at that place. */
  week: z.string(),
  /** How many weeks it closed at that place. */
  times: z.number().int().positive(),
});

export const adminProjectBadgeAwardSchema = projectBadgeAwardSchema.extend({
  awardedBy: z.object({ id: z.string(), name: z.string() }).nullable(),
});

export const grantProjectBadgeBodySchema = z
  .object({
    key: projectBadgeKeySchema,
    period: projectBadgeMonthSchema.optional(),
  })
  .superRefine((body, ctx) => {
    if (projectBadgeCatalog[body.key].period === "month" && !body.period) {
      ctx.addIssue({ code: "custom", path: ["period"], message: "Escolhe o mês." });
    }
  });

/**
 * An award on one of the signed-in maker's projects that they haven't been
 * shown yet, with enough of the project to celebrate it.
 */
export const unseenProjectBadgeSchema = projectBadgeAwardSchema.extend({
  project: z.object({
    id: z.number(),
    slug: z.string(),
    name: z.string(),
    logoUrl: z.string().nullable(),
  }),
});

export const markProjectBadgesSeenBodySchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(50),
});

export type ProjectBadgeAward = z.infer<typeof projectBadgeAwardSchema>;
export type UnseenProjectBadge = z.infer<typeof unseenProjectBadgeSchema>;
export type MarkProjectBadgesSeenBody = z.infer<typeof markProjectBadgesSeenBodySchema>;
export type AdminProjectBadgeAward = z.infer<typeof adminProjectBadgeAwardSchema>;
export type BestWeeklyRank = z.infer<typeof bestWeeklyRankSchema>;
export type GrantProjectBadgeBody = z.infer<typeof grantProjectBadgeBodySchema>;
