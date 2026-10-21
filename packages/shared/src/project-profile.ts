import { z } from "zod";
export const helpWantedLabels = {
  feedback: "Feedback",
  testers: "Pessoas para testar",
  development: "Programação",
  design: "Design",
  mentoring: "Mentoria",
  partnerships: "Parcerias",
} as const;
export const helpWantedValues = [
  "feedback",
  "testers",
  "development",
  "design",
  "mentoring",
  "partnerships",
] as const;
export const projectProfileFields = {
  languages: z
    .array(z.string().trim().min(1).max(50))
    .max(10)
    .refine(
      (values) => new Set(values.map((value) => value.toLocaleLowerCase())).size === values.length,
      "Escolhe línguas diferentes.",
    )
    .default([]),
  helpWanted: z
    .array(z.enum(helpWantedValues))
    .max(6)
    .refine((values) => new Set(values).size === values.length)
    .default([]),
  helpDescription: z.string().trim().max(500).nullish(),
  teamDescription: z.string().trim().max(500).nullish(),
};
