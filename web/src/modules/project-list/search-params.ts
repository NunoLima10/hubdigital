import { z } from "zod";
import {
  availabilityValues,
  helpWantedValues,
  islandValues,
  listPeriodValues,
  pricingValues,
  projectStageValues,
} from "@hubdigital/shared";

export const discoverySearchSchema = z.object({
  search: z
    .preprocess(
      (value) =>
        value === "true" || value === "1"
          ? true
          : value === "false" || value === "0"
            ? false
            : value,
      z.boolean().optional(),
    )
    .catch(undefined),
  q: z.string().trim().min(1).max(120).optional().catch(undefined),
  island: z.enum(islandValues).optional().catch(undefined),
  categoryId: z.coerce.number().int().positive().optional().catch(undefined),
  pricing: z.enum(pricingValues).optional().catch(undefined),
  availability: z.enum(availabilityValues).optional().catch(undefined),
  projectStage: z.enum(projectStageValues).optional().catch(undefined),
  helpWanted: z.enum(helpWantedValues).optional().catch(undefined),
  period: z.enum(listPeriodValues).optional().catch(undefined),
});
