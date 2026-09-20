import {
  formatLocation,
  locationSchema,
  type Country,
  type Island,
  type MunicipalityCode,
  type ProjectLocation,
} from "@hubdigital/shared";

/**
 * The location as the form holds it: every level is always present, with "" for
 * "not chosen yet", so the selects stay controlled. The API takes a nested,
 * discriminated shape instead — see `locationFromFormValue`.
 */
export type LocationFormValue = {
  country: Country | "";
  island: Island | "";
  municipality: MunicipalityCode | "";
  /**
   * There is no zone picker yet (zone names come from a dataset this app does
   * not have), but a project can already carry one. It is round-tripped so
   * editing a project does not silently wipe it, and dropped as soon as the
   * municipality it belongs to changes.
   */
  zone: string;
};

export const emptyLocation: LocationFormValue = {
  country: "",
  island: "",
  municipality: "",
  zone: "",
};

export function locationToFormValue(
  location: ProjectLocation | null | undefined
): LocationFormValue {
  if (!location) return emptyLocation;
  if (location.country !== "cv") return { ...emptyLocation, country: location.country };

  return {
    country: "cv",
    island: location.island,
    municipality: location.municipality ?? "",
    zone: location.zone ?? "",
  };
}

/**
 * Turns the form value into what the API contract expects. Returns `undefined`
 * while no country is chosen, and leaves a missing island off rather than
 * inventing one, so validating the result reports the field the person still
 * has to fill in. Typed `unknown` because it is only meaningful once
 * `locationSchema` has accepted it.
 */
export function locationFromFormValue(value: LocationFormValue): unknown {
  if (!value.country) return undefined;
  if (value.country !== "cv") return { country: value.country };

  return {
    country: "cv",
    island: value.island || undefined,
    municipality: value.municipality || undefined,
    zone: value.zone || undefined,
  };
}

/** True once the required levels are chosen: a country, plus an island in Cabo Verde. */
export function isLocationComplete(value: LocationFormValue): boolean {
  if (!value.country) return false;
  return value.country !== "cv" || value.island !== "";
}

/** "Praia, Santiago" for the review step, or null while there is nothing valid to show. */
export function formatLocationFormValue(value: LocationFormValue): string | null {
  const parsed = locationSchema.safeParse(locationFromFormValue(value));
  return parsed.success ? formatLocation(parsed.data) : null;
}
