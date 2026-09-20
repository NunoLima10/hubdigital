import { projects } from "@/db/schemas";
import type { MunicipalityCode, ProjectLocation } from "@hubdigital/shared";

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
}: LocationColumns): ProjectLocation | null {
  if (!country) return null;
  if (country !== "cv") return { country };
  if (!island) return null;

  return {
    country,
    island,
    ...(municipality ? { municipality: municipality as MunicipalityCode } : {}),
    ...(zone ? { zone } : {}),
  };
}

/**
 * The flat columns for a location. Always returns all four keys, so an update
 * that moves a project from Santiago to Portugal clears the island instead of
 * leaving a stale one behind.
 */
export function locationToColumns(location: ProjectLocation): LocationColumns {
  if (location.country !== "cv") {
    return {
      country: location.country,
      island: null,
      municipality: null,
      zone: null,
    };
  }

  return {
    country: "cv",
    island: location.island,
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
  const { country, island, municipality, zone, ...rest } = row;

  return {
    ...rest,
    location: locationFromColumns({ country, island, municipality, zone }),
  };
}
