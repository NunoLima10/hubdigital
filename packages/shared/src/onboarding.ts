/** Onboarding answers, stored on `publishers` as Postgres enums. */
export const profileQuestionValues = [
  "student",
  "technology-professional",
  "founder",
  "investor",
] as const;

export type ProfileResponse = (typeof profileQuestionValues)[number];

export const objectiveQuestionValues = [
  "discover-products",
  "launch-product",
  "networking",
  "explore",
] as const;

export type ObjectiveResponse = (typeof objectiveQuestionValues)[number];

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
