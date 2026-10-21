import type { CreateProjectInput } from "../types/project";
import { emptyLocation } from "../utils/location";

export const initialProjectValues: CreateProjectInput = {
  name: "", shortDescription: "", description: "", links: [],
  logoUrl: undefined, galleryImageKeys: [], youtubeVideoUrl: "", pricing: "",
  platform: [], businessModel: "", availability: "", sourceModel: "", licenseId: "", projectStage: "", audiences: [],
  languages: [], helpWanted: [], helpDescription: "", teamDescription: "",
  additionalLocations: [], teamMode: null, localConnections: [], serviceArea: null,
  location: emptyLocation, categoryId: "", secondaryCategoryIds: [],
};

