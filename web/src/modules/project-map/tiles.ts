import { env } from "@/app/env";
import type * as Leaflet from "leaflet";

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// OSM permits modest interactive browser use with attribution, the browser's
// normal caching and Referer. Do not prefetch or proxy these tiles. Higher
// traffic deployments can configure a dedicated provider through the env.
// https://operations.osmfoundation.org/policies/tiles/
// CARTO's raster endpoint now requires a key and cannot be our keyless default.
const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

/** Adds the base map layer. `extraAttribution` credits overlay data. */
export function addBaseTiles(
  L: typeof Leaflet,
  map: Leaflet.Map,
  options: { className?: string; extraAttribution?: string } = {},
) {
  const url = env.MAP_TILE_URL || DEFAULT_TILE_URL;
  const attribution = env.MAP_TILE_ATTRIBUTION || OSM_ATTRIBUTION;
  return L.tileLayer(url, {
    attribution: [attribution, options.extraAttribution]
      .filter(Boolean)
      .join(" · "),
    subdomains: "abcd",
    maxZoom: 19,
    // Keep requests limited to the current viewport, especially on mobile.
    keepBuffer: 0,
    updateWhenIdle: true,
    className: options.className,
  }).addTo(map);
}
