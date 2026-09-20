import { islandLabels } from "./island-options";
import { countryLabels, municipalityLabels } from "./location-options";
import type { ProjectLocation } from "./location-schema";

/**
 * A location as a person would write it: "Praia, Santiago" inside Cabo Verde,
 * just the island when there is no municipality, and the country's name abroad.
 * A zone is left out because only its code is known here, not its name.
 */
export function formatLocation(location: ProjectLocation): string {
  if (location.country !== "cv") return countryLabels[location.country];

  const island = islandLabels[location.island];

  return location.municipality
    ? `${municipalityLabels[location.municipality]}, ${island}`
    : island;
}
