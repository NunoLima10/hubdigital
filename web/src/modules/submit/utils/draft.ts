import { z } from "zod";
import {
  projectDraftSchema,
  countryValues,
  islandValues,
  municipalityValues,
  publicPinSchema,
  type ProjectDraft,
} from "@hubdigital/shared";
import type { CreateProjectInput, Project } from "../types/project";
import { emptyLocation, locationFromFormValue, locationToFormValue } from "./location";

/** Validate browser recovery data before using it as controlled form values. */
export const draftFormSchema = projectDraftSchema.extend({
  helpDescription: z.string().max(500).default(""),
  teamDescription: z.string().max(500).default(""),
  name: z.string().max(120),
  youtubeVideoUrl: z.string().max(2048).default(""),
  pricing: projectDraftSchema.shape.pricing.unwrap().unwrap().or(z.literal("")),
  businessModel: projectDraftSchema.shape.businessModel.unwrap().unwrap().or(z.literal("")),
  availability: projectDraftSchema.shape.availability.unwrap().unwrap().or(z.literal("")),
  sourceModel: projectDraftSchema.shape.sourceModel.unwrap().unwrap().or(z.literal("")),
  licenseId: z.string().max(80),
  projectStage: projectDraftSchema.shape.projectStage.unwrap().unwrap().or(z.literal("")),
  categoryId: z.number().int().positive().or(z.literal("")),
  location: z.object({
    country: z.enum(countryValues).or(z.literal("")),
    island: z.enum(islandValues).or(z.literal("")),
    municipality: z.enum(municipalityValues).or(z.literal("")),
    zone: z.string().max(13),
    locality: z.string().max(120).default(""),
    publicPin: publicPinSchema.nullish(),
  }),
});

export const draftRecoverySchema = z.object({
  values: draftFormSchema,
  step: z.number().int().min(0).max(3),
  projectId: z.number().int().positive().nullable(),
  creationKey: z.string().uuid(),
});

export function draftPayloadFromForm(values: CreateProjectInput) {
  return {
    ...values,
    // An unfinished answer from the removed service-area control must not block publication.
    serviceArea:
      values.serviceArea?.scope === "countries" && !values.serviceArea.countries.length
        ? null
        : values.serviceArea,
    pricing: values.pricing || null,
    businessModel: values.businessModel || null,
    availability: values.availability || null,
    sourceModel: values.sourceModel || null,
    licenseId: values.licenseId || null,
    projectStage: values.projectStage || null,
    categoryId: values.categoryId || null,
    location: locationFromFormValue(values.location) ?? null,
    youtubeVideoUrl: values.youtubeVideoUrl || null,
  };
}
export function toDraftPayload(values: CreateProjectInput): ProjectDraft {
  return projectDraftSchema.parse(draftPayloadFromForm(values));
}

export function projectToFormValues(project: Project): CreateProjectInput {
  const proposal =
    project.status === "published" && project.editReview && project.editReview.status !== "approved"
      ? project.editReview.body
      : null;
  const source = proposal ? { ...project, ...proposal } : project;
  const location = proposal ? proposal.location : (project.draftLocation ?? project.location);
  return {
    name: source.name,
    shortDescription: source.shortDescription,
    description: source.description ?? "",
    links: source.links,
    logoUrl: proposal ? proposal.logoUrl : source.logoUrl ? undefined : null,
    galleryImageKeys: source.galleryImageKeys,
    youtubeVideoUrl: proposal
      ? (proposal.youtubeVideoUrl ?? "")
      : (source.youtubeVideoUrl ??
        (source.youtubeVideoId ? `https://www.youtube.com/watch?v=${source.youtubeVideoId}` : "")),
    pricing: source.pricing ?? "",
    platform: source.platform,
    businessModel: source.businessModel ?? "",
    availability: source.availability ?? "",
    sourceModel: source.sourceModel ?? "",
    licenseId: source.licenseId ?? "",
    projectStage: source.projectStage ?? "",
    audiences: source.audiences,
    languages: source.languages,
    helpWanted: source.helpWanted,
    helpDescription: source.helpDescription ?? "",
    teamDescription: source.teamDescription ?? "",
    additionalLocations: source.additionalLocations,
    teamMode: source.teamMode ?? null,
    localConnections: source.localConnections,
    serviceArea: source.serviceArea ?? null,
    categoryId: source.categoryId ?? "",
    secondaryCategoryIds: source.secondaryCategoryIds,
    location:
      location?.country === "cv"
        ? {
            ...emptyLocation,
            ...location,
            island: location.island ?? "",
            municipality: location.municipality ?? "",
            zone: location.zone ?? "",
          }
        : locationToFormValue(location),
  };
}
