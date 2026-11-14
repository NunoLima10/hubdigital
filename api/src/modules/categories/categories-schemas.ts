import { routeErrorResponses } from "@/shared/schemas";
import { categorySummarySchema as categorySchema } from "@hubdigital/shared";
import { z } from "zod";

export const listCategoriesRouteSchema = {
  tags: ["categories"],
  response: {
    200: z.object({
      data: z.array(categorySchema),
    }),
    ...routeErrorResponses,
  },
};
