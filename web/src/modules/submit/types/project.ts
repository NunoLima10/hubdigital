import type {
  CategorySummary,
  Project as SharedProject,
  ProjectMinimal as SharedProjectMinimal,
} from "@hubdigital/shared";
import {
  availabilityValues,
  sourceModelValues,
  audienceValues,
  businessModelValues,
  platformValues,
  pricingValues,
  projectStageValues,
} from "../options";
import type { LocationFormValue } from "../utils/location";

export type CreateProjectInput = {
  name: string;
  shortDescription: string;
  description?: string;
  links: import("@hubdigital/shared").ProjectLinkInput[];
  logoKey?: string | null;
  galleryImageKeys: string[];
  youtubeVideoUrl?: string | null;
  pricing: (typeof pricingValues)[number] | "";
  platform: (typeof platformValues)[number][];
  businessModel: (typeof businessModelValues)[number] | "";
  availability: (typeof availabilityValues)[number] | "";
  sourceModel: (typeof sourceModelValues)[number] | "";
  licenseId: string;
  projectStage: (typeof projectStageValues)[number] | "";
  audiences: (typeof audienceValues)[number][];
  location: LocationFormValue;
  languages: string[];
  helpWanted: SharedProject["helpWanted"];
  helpDescription: string;
  teamDescription: string;
  additionalLocations: import("@hubdigital/shared").ProjectLocation[];
  teamMode: "local" | "distributed" | null;
  localConnections: SharedProject["localConnections"];
  serviceArea: SharedProject["serviceArea"];
  categoryId: number | "";
  secondaryCategoryIds: number[];
};

export type Category = CategorySummary;

export type Project = SharedProject;

export type ProjectMinimal = SharedProjectMinimal;
