import { env } from "@/app/env";
import type * as Leaflet from "leaflet";

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// CARTO's free basemaps, built for third-party sites, unlike the OpenStreetMap
// tile servers, whose usage policy rules out production traffic. A provider
// with a key (MapTiler, Stadia) can replace them through the env.
const CARTO = {
  url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  attribution: `${OSM_ATTRIBUTION} &copy; <a href="https://carto.com/attributions">CARTO</a>`,
};

/** Adds the base map layer. `extraAttribution` credits overlay data. */
export function addBaseTiles(
  L: typeof Leaflet,
  map: Leaflet.Map,
  options: { className?: string; extraAttribution?: string } = {},
) {
  const url = env.MAP_TILE_URL || CARTO.url;
  const attribution = env.MAP_TILE_URL ? env.MAP_TILE_ATTRIBUTION || OSM_ATTRIBUTION : CARTO.attribution;
  return L.tileLayer(url, {
    attribution: [attribution, options.extraAttribution].filter(Boolean).join(" · "),
    subdomains: "abcd",
    maxZoom: 19,
    className: options.className,
  }).addTo(map);
}
