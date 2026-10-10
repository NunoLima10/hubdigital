import type { ListPeriod } from "@hubdigital/shared";

export const projectPeriodOptions = [
  ["all", "Todos"],
  ["this_week", "Esta semana"],
  ["this_month", "Este mes"],
] as const satisfies readonly (readonly [ListPeriod, string])[];
