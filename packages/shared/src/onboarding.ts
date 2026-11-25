import { z } from "zod";

/**
 * A non-empty list of distinct answers, for the questions where people can
 * pick more than one option.
 */
const answerListSchema = <const T extends readonly string[]>(values: T, emptyMessage: string) =>
  z
    .array(z.enum(values))
    .min(1, emptyMessage)
    .refine(
      (picked) => new Set(picked).size === picked.length,
      "Cada opção só pode ser escolhida uma vez.",
    );

/** Onboarding answers, stored on `publishers` as Postgres enums. */
export const profileQuestionValues = [
  "student",
  "technology-professional",
  "founder",
  "investor",
] as const;

export type ProfileResponse = (typeof profileQuestionValues)[number];

/** People can identify with more than one profile, so it is a list. */
export const profileResponsesSchema = answerListSchema(
  profileQuestionValues,
  "Escolhe pelo menos um perfil.",
);

export const objectiveQuestionValues = [
  "discover-products",
  "launch-product",
  "networking",
  "explore",
] as const;

export type ObjectiveResponse = (typeof objectiveQuestionValues)[number];

/** People can come to the platform for more than one reason. */
export const objectiveResponsesSchema = answerListSchema(
  objectiveQuestionValues,
  "Escolhe pelo menos um objetivo.",
);

export const locationQuestionValues = [
  "CV1",
  "CV2",
  "CV3",
  "CV4",
  "CV5",
  "CV6",
  "CV7",
  "CV8",
  "CV9",
  "diaspora",
] as const;

export type LocationResponse = (typeof locationQuestionValues)[number];

export const foundUsByQuestionValues = [
  "social-media",
  "friends",
  "event",
  "online-search",
] as const;

export type FoundUsByResponse = (typeof foundUsByQuestionValues)[number];
