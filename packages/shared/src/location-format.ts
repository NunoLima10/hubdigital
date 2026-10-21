import { islandLabels } from "./island-options";
import { countryLabels, municipalityLabels } from "./location-options";
import type { ProjectLocation } from "./location-schema";

/**
 * A location as a person would write it: "Praia, Santiago" inside Cabo Verde,
 * just the island when there is no municipality, and the country's name abroad.
 * A zone is left out because only its code is known here, not its name.
 */
export function formatLocation(location: ProjectLocation): string {
  if (location.country !== "cv")
    return [location.locality, countryLabels[location.country]].filter(Boolean).join(", ");

  const island = location.island ? islandLabels[location.island] : "Cabo Verde";

  return location.locality
    ? `${location.locality}, ${island}`
    : location.municipality
      ? `${municipalityLabels[location.municipality]}, ${island}`
      : island;
}
