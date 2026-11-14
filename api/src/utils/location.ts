import { projects } from "@/db/schemas";
import type { DraftProjectLocation, MunicipalityCode, ProjectLocation } from "@hubdigital/shared";

export type LocationColumns = Pick<
  typeof projects.$inferSelect,
  "country" | "island" | "municipality" | "zone"
>;

/**
 * Rebuilds the nested location from the flat columns. Null when the row has no
 * country — projects that predate the field — or when the columns do not form a
 * valid location (a Cabo Verde row without an island), rather than guessing.
 */
export function locationFromColumns({
  country,
  island,
  municipality,
  zone,
  locationDetails = {},
}: LocationColumns & {
  locationDetails?: Pick<ProjectLocation, "locality" | "publicPin">;
}): ProjectLocation | null {
  if (!country) return null;
  if (country !== "cv")
    return {
      country: country as ProjectLocation["country"],
      ...locationDetails,
    } as ProjectLocation;

  return {
    country,
    ...(island ? { island } : {}),
    ...locationDetails,
    ...(municipality ? { municipality: municipality as MunicipalityCode } : {}),
    ...(zone ? { zone } : {}),
  };
}

/**
 * The flat columns for a location. Always returns all four keys, so an update
 * that moves a project from Santiago to Portugal clears the island instead of
 * leaving a stale one behind.
 */
export function locationToColumns(location: DraftProjectLocation | null) {
  if (!location)
    return { country: null, island: null, municipality: null, zone: null, locationDetails: {} };
  if (location.country !== "cv") {
    return {
      locationDetails: { locality: location.locality, publicPin: location.publicPin },
      country: location.country,
      island: null,
      municipality: null,
      zone: null,
    };
  }

  return {
    locationDetails: { locality: location.locality, publicPin: location.publicPin },
    country: "cv",
    island: location.island ?? null,
    municipality: location.municipality ?? null,
    zone: location.zone ?? null,
  };
}

/**
 * Swaps the four flat location columns on a row for the nested `location` the
 * API contract exposes. Everything that serializes a project goes through this,
 * so the columns never leak into a response.
 */
export function withLocation<T extends LocationColumns>(row: T) {
  const {
    country,
    island,
    municipality,
    zone,
    locationDetails = {},
    ...rest
  } = row as T & { locationDetails?: Pick<ProjectLocation, "locality" | "publicPin"> };

  return {
    ...rest,
    location: locationFromColumns({ country, island, municipality, zone, locationDetails }),
    ...("status" in row && row.status !== "published"
      ? {
          draftLocation:
            country === "cv"
              ? {
                  country,
                  ...locationDetails,
                  ...(island ? { island } : {}),
                  ...(municipality ? { municipality } : {}),
                  ...(zone ? { zone } : {}),
                }
              : country
                ? { country, ...locationDetails }
                : null,
        }
      : {}),
  };
}
