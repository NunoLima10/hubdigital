import { countryReference, type Country, type ProjectLocation } from "@hubdigital/shared";
import { islandMapData } from "./islands";
export function locationPosition(location: ProjectLocation): [number, number] {
  if (location.publicPin) return [location.publicPin.latitude, location.publicPin.longitude];
  if (location.country === "cv" && location.island) return islandMapData[location.island].center;
  return [...countryReference[location.country].center];
}
export function positionLabel(location: ProjectLocation) {
  return location.publicPin?.precision === "exact"
    ? "Local público exato"
    : location.publicPin
      ? "Localização aproximada"
      : "Região da equipa";
}

export function matchesMapLocation(
  location: ProjectLocation | null | undefined,
  world: boolean,
  country: Country | "" = "",
  island = "",
): location is ProjectLocation {
  if (!location || (!world && location.country !== "cv")) return false;
  if (world && country && location.country !== country) return false;
  if (!world && island && (location.country !== "cv" || location.island !== island)) return false;
  return true;
}
