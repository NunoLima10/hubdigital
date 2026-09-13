import { z } from "zod";
import { fileUploadTypeValues } from "./file-upload.js";
import { islandValues } from "./island-options.js";
import { projectStatusValues } from "./project-status.js";
import {
  accessValues,
  audienceValues,
  businessModelValues,
  platformValues,
  pricingValues,
  projectStageValues,
} from "./project-options.js";

// Images are not free-form URLs: the client uploads through POST /v1/uploads and
// sends back the storage key it was given. Constraining the shape here keeps the
// field from being pointed at an arbitrary host, and keeps path traversal out.
const uploadKeySchema = z
  .string()
  .regex(
    new RegExp(`^(${fileUploadTypeValues.join("|")})/[^/\\\\]+$`),
    "Imagem inválida. Carregue o ficheiro novamente."
  );

export const categorySummarySchema = z.object({
  id: z.number(),
  key: z.string(),
  name: z.string(),
});

export const projectAuthorSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().nullable(),
  /** Null when the person has no publisher profile (e.g. a commenter). */
  handle: z.string().nullable(),
});

export const projectBodySchema = z.object({
  name: z.string().min(2).max(120),
  shortDescription: z.string().min(10).max(200),
  description: z.string().max(20000).optional(),
  websiteUrl: z.string().url(),
  githubUrl: z.string().url().optional(),
  // nullish: omitted means "leave as is" on PATCH, null means "remove the image".
  logoUrl: uploadKeySchema.nullish(),
  bannerImageUrl: uploadKeySchema.nullish(),
  pricing: z.enum(pricingValues),
  platform: z.array(z.enum(platformValues)).min(1),
  businessModel: z.enum(businessModelValues),
  access: z.enum(accessValues),
  projectStage: z.enum(projectStageValues),
  audienceStage: z.enum(audienceValues),
  island: z.enum(islandValues),
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
  island: z.enum(islandValues).nullable(),
  categoryId: z.number(),
  category: categorySummarySchema.nullable().optional(),
  author: projectAuthorSchema.nullable().optional(),
  upvoteCount: z.number(),
  hasUpvoted: z.boolean(),
  commentCount: z.number(),
  status: z.enum(projectStatusValues),
  publishedAt: z.string().nullable(),
  launchedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),

  // Moderation state, serialized only when the requester owns the project.
  // Absent for every other viewer — a visitor must not be able to tell a hidden
  // project from one that never existed.
  rejectionReason: z.string().nullable().optional(),
  hidden: z.boolean().optional(),
  hiddenReason: z.string().nullable().optional(),
  hiddenAt: z.string().nullable().optional(),
});

export const projectMinimalFields = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  websiteUrl: true,
  logoUrl: true,
  pricing: true,
  island: true,
  category: true,
  createdAt: true,
  launchedAt: true,
  upvoteCount: true,
  hasUpvoted: true,
  commentCount: true,
} as const;

export const projectMinimalSchema = projectSchema.pick(projectMinimalFields);

export type CategorySummary = z.infer<typeof categorySummarySchema>;
export type ProjectAuthor = z.infer<typeof projectAuthorSchema>;
export type ProjectBody = z.infer<typeof projectBodySchema>;
export type Project = z.infer<typeof projectSchema>;
export type ProjectMinimal = z.infer<typeof projectMinimalSchema>;
