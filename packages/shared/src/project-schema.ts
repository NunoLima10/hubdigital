import { z } from "zod";
import {
  accessValues,
  audienceValues,
  businessModelValues,
  platformValues,
  pricingValues,
  projectStageValues,
} from "./project-options.js";

export const categorySummarySchema = z.object({
  id: z.number(),
  key: z.string(),
  name: z.string(),
});

export const projectBodySchema = z.object({
  name: z.string().min(2).max(120),
  shortDescription: z.string().min(10).max(200),
  description: z.string().max(20000).optional(),
  websiteUrl: z.string().url(),
  githubUrl: z.string().url().optional(),
  pricing: z.enum(pricingValues),
  platform: z.array(z.enum(platformValues)).min(1),
  businessModel: z.enum(businessModelValues),
  access: z.enum(accessValues),
  projectStage: z.enum(projectStageValues),
  audienceStage: z.enum(audienceValues),
  categoryId: z.number().int().positive(),
});

export const projectSchema = z.object({
  id: z.number(),
  publisherId: z.number(),
  name: z.string(),
  slug: z.string(),
  shortDescription: z.string(),
  description: z.string().nullable(),
  websiteUrl: z.string(),
  logoUrl: z.string().nullable(),
  bannerImageUrl: z.string().nullable(),
  githubUrl: z.string().nullable(),
  pricing: z.enum(pricingValues),
  platform: z.array(z.enum(platformValues)),
  businessModel: z.enum(businessModelValues),
  access: z.enum(accessValues),
  projectStage: z.enum(projectStageValues),
  audienceStage: z.enum(audienceValues),
  categoryId: z.number(),
  category: categorySummarySchema.nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const projectMinimalFields = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  websiteUrl: true,
  logoUrl: true,
  pricing: true,
  category: true,
  createdAt: true,
} as const;

export const projectMinimalSchema = projectSchema.pick(projectMinimalFields);

export type CategorySummary = z.infer<typeof categorySummarySchema>;
export type ProjectBody = z.infer<typeof projectBodySchema>;
export type Project = z.infer<typeof projectSchema>;
export type ProjectMinimal = z.infer<typeof projectMinimalSchema>;
