import { z } from "zod";

export const errorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
});

export const routeErrorResponses = {
  400: errorResponseSchema,
  401: errorResponseSchema,
  404: errorResponseSchema,
  409: errorResponseSchema,
  500: errorResponseSchema,
};
