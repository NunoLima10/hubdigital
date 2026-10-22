import { projectProfileFields } from "./project-profile";
import { countryValues as importCountryValues } from "./location-options";
import { z } from "zod";
import { draftLocationSchema, locationSchema, projectGeographyFields } from "./location-schema";
import { projectRevisionStatusValues, projectStatusValues } from "./project-status";
import { youtubeVideoUrlSchema } from "./youtube";
import { projectDraftLinkSchema, projectLinkSchema, projectLinkHref } from "./project-links";
import {
  availabilityValues,
  sourceModelValues,
  audienceValues,
  businessModelValues,
  platformValues,
  pricingValues,
  projectStageValues,
} from "./project-options";

// Images are not free-form URLs: the client uploads through POST /v1/uploads and
// sends back the storage key it was given. Constraining the shape here keeps the
// field from being pointed at an arbitrary host, and keeps path traversal out.
const uploadKeySchema = z
  .string()
  .regex(/^project_logo\/[^/\\]+$/, "Imagem inválida. Carregue o ficheiro novamente.");

const galleryUploadKeySchema = z
  .string()
  .regex(
    /^project_gallery\/[^/\\]+$/,
    "Imagem da galeria inválida. Carregue o ficheiro novamente.",
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

export const secondaryCategoryIdsSchema = z
  .array(z.number().int().positive())
  .max(2, "Escolhe no máximo duas categorias adicionais.")
  .refine((ids) => new Set(ids).size === ids.length, "Escolhe categorias diferentes.")
  .default([]);

export function refineProjectCategories(
  value: { categoryId?: number | null; secondaryCategoryIds?: number[] },
  context: z.RefinementCtx,
) {
  if (value.categoryId && value.secondaryCategoryIds?.includes(value.categoryId)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["secondaryCategoryIds"],
      message: "A categoria principal já está selecionada.",
    });
  }
  if (!value.categoryId && value.secondaryCategoryIds?.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["categoryId"],
      message: "Escolhe uma categoria principal.",
    });
  }
}

export const projectBodySchema = z.object({
  name: z.string().min(2).max(120),
  shortDescription: z.string().min(10).max(200),
  description: z.string().max(20000).optional(),
  links: z.array(projectLinkSchema).max(8).default([]),
  // nullish: omitted means "leave as is" on PATCH, null means "remove the image".
  logoKey: uploadKeySchema.nullish(),
  galleryImageKeys: z
    .array(galleryUploadKeySchema)
    .max(10, "Pode adicionar no máximo 10 imagens.")
    .refine((values) => new Set(values).size === values.length, {
      message: "A mesma imagem não pode aparecer mais do que uma vez.",
    })
    .default([]),
  youtubeVideoUrl: youtubeVideoUrlSchema.nullish(),
  pricing: z.enum(pricingValues).nullish(),
  platform: z.array(z.enum(platformValues)).default([]),
  businessModel: z.enum(businessModelValues).nullish(),
  sourceModel: z.enum(sourceModelValues).nullish(),
  licenseId: z.string().trim().max(80).nullish(),
  availability: z.enum(availabilityValues),
  projectStage: z.enum(projectStageValues),
  audiences: z.array(z.enum(audienceValues)).default([]),
  ...projectGeographyFields,
  ...projectProfileFields,
  location: locationSchema.nullish(),
  categoryId: z.number().int().positive(),
  secondaryCategoryIds: secondaryCategoryIdsSchema,
});

export function refineProjectPublication(
  value: Pick<
    z.infer<typeof projectBodySchema>,
    "links" | "availability" | "categoryId" | "secondaryCategoryIds"
  >,
  context: z.RefinementCtx,
) {
  refineProjectCategories(value, context);
  const primary = value.links.filter((link) => link.isPrimary);
  if (
    primary.length > 1 ||
    (!["not_available", "unavailable"].includes(value.availability) && primary.length !== 1)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["links"],
      message: "Escolhe um único link principal para experimentar, instalar ou pedir acesso.",
    });
  }
  const hrefs = value.links.map(projectLinkHref).filter(Boolean);
  if (new Set(hrefs).size !== hrefs.length)
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["links"],
      message: "O mesmo destino não precisa de aparecer mais do que uma vez.",
    });
}
export const projectPublicationSchema = projectBodySchema.superRefine(refineProjectPublication);

// Drafts preserve unfinished text/URLs and unanswered questions. Only publication
// uses projectBodySchema; a draft is never an implicit public submission.
export const projectDraftSchema = projectBodySchema.extend({
  serviceArea: z
    .object({
      scope: z.enum(["countries", "worldwide"]),
      countries: z.array(z.enum(importCountryValues)).max(249).default([]),
    })
    .nullish(),
  name: z.string().trim().min(1, "Dá um nome ao rascunho.").max(120),
  shortDescription: z.string().max(200).default(""),
  links: z.array(projectDraftLinkSchema).max(8).default([]),
  youtubeVideoUrl: z.string().max(2048).nullable().optional(),
  pricing: z.enum(pricingValues).nullable().optional(),
  platform: z.array(z.enum(platformValues)).default([]),
  businessModel: z.enum(businessModelValues).nullable().optional(),
  availability: z.enum(availabilityValues).nullable().optional(),
  projectStage: z.enum(projectStageValues).nullable().optional(),
  location: draftLocationSchema.nullable().optional(),
  categoryId: z.number().int().positive().nullable().optional(),
});

export const createProjectDraftSchema = projectDraftSchema.extend({
  creationKey: z.string().uuid().optional(),
});

export type ProjectDraft = z.infer<typeof projectDraftSchema>;

export const projectSchema = z.object({
  id: z.number(),
  publisherId: z.number(),
  name: z.string(),
  slug: z.string(),
  shortDescription: z.string(),
  description: z.string().nullable(),
  links: z.array(projectDraftLinkSchema.extend({ id: z.number() })),
  /** The stored upload key, for edit forms; `logoUrl` is its public URL. */
  logoKey: z.string().nullable().optional(),
  logoUrl: z.string().nullable(),
  galleryImageKeys: z.array(z.string()),
  galleryImageUrls: z.array(z.string()),
  youtubeVideoId: z.string().nullable(),
  youtubeVideoUrl: z.string().nullable().optional(),
  pricing: z.enum(pricingValues).nullable(),
  platform: z.array(z.enum(platformValues)),
  businessModel: z.enum(businessModelValues).nullable(),
  availability: z.enum(availabilityValues).nullable(),
  sourceModel: z.enum(sourceModelValues).nullable(),
  licenseId: z.string().nullable(),
  projectStage: z.enum(projectStageValues).nullable(),
  audiences: z.array(z.enum(audienceValues)),
  // Null for rows created before location existed.
  ...projectGeographyFields,
  ...projectProfileFields,
  location: locationSchema.nullable(),
  draftLocation: draftLocationSchema.nullable().optional(),
  categoryId: z.number().nullable(),
  secondaryCategoryIds: z.array(z.number()),
  secondaryCategories: z.array(categorySummarySchema),
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

  editReview: z
    .object({
      id: z.number(),
      body: projectBodySchema,
      createdAt: z.string(),
      status: z.enum(projectRevisionStatusValues),
      reason: z.string().nullable(),
    })
    .nullable()
    .optional(),
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
  links: true,
  availability: true,
  projectStage: true,
  logoUrl: true,
  pricing: true,
  location: true,
  category: true,
  secondaryCategories: true,
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
