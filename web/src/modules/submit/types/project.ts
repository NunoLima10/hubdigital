import type {
  CategorySummary,
  Project as SharedProject,
  ProjectMinimal as SharedProjectMinimal,
} from "@hubdigital/shared";
import {
  accessValues,
  audienceValues,
  businessModelValues,
  platformValues,
  pricingValues,
  projectStageValues,
} from "../options";

export type CreateProjectInput = {
  name: string;
  shortDescription: string;
  description?: string;
  websiteUrl: string;
  githubUrl?: string;
  pricing: (typeof pricingValues)[number] | "";
  platform: (typeof platformValues)[number][];
  businessModel: (typeof businessModelValues)[number] | "";
  access: (typeof accessValues)[number] | "";
  projectStage: (typeof projectStageValues)[number] | "";
  audienceStage: (typeof audienceValues)[number] | "";
  categoryId: number | "";
};

export type Category = CategorySummary;

export type Project = SharedProject;

export type ProjectMinimal = SharedProjectMinimal;
