import { islandLabels, islandValues } from "@hubdigital/shared";
import type { ExpressionSpecification, StyleSpecification } from "maplibre-gl";
import { islandMapData } from "./islands";

// A deliberately quiet map: land, sea, island names and little else. The
// vector tiles (OpenStreetMap data in the OpenMapTiles schema) come from
// OpenFreeMap, which is free and needs no key. Every layer is ours, so
// anything here can be shown, hidden or recoloured.
// https://openfreemap.org — layers: https://openmaptiles.org/schema/
const OPENFREEMAP = "https://tiles.openfreemap.org";

export type MapPalette = {
  land: string;
  sea: string;
  border: string;
  road: string;
  label: string;
  halo: string;
};

type Rgb = [number, number, number];

/** Resolves any CSS colour (oklch, var(), color-mix) to RGB by painting one pixel. */
function toRgb(element: Element, value: string): Rgb {
  const probe = document.createElement("span");
  probe.style.color = value;
  element.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!context) return [128, 128, 128];
  context.fillStyle = resolved;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

const mix = (a: Rgb, b: Rgb, amount: number): Rgb =>
  a.map((value, index) => Math.round(value + (b[index] - value) * amount)) as Rgb;

const css = ([r, g, b]: Rgb) => `rgb(${r}, ${g}, ${b})`;

/** The map's colours, read from the app theme so it follows light and dark. */
export function readPalette(element: Element): MapPalette {
  const dark = document.documentElement.classList.contains("dark");
  const background = toRgb(element, "var(--background)");
  const muted = toRgb(element, "var(--muted)");
  const primary = toRgb(element, "var(--primary)");
  const foreground = toRgb(element, "var(--foreground)");
  // Land is the lighter surface, the sea the darker one with a hint of the
  // brand blue, in both themes.
  const land = dark ? muted : background;
  const sea = dark ? mix(background, primary, 0.1) : mix(muted, primary, 0.14);
  return {
    land: css(land),
    sea: css(sea),
    border: css(mix(land, foreground, 0.3)),
    road: css(mix(land, foreground, 0.14)),
    label: css(mix(land, foreground, 0.62)),
    halo: css(mix(land, sea, 0.5)),
  };
}

/** Portuguese name when the map has one. */
const placeName: ExpressionSpecification = [
  "coalesce",
  ["get", "name:pt"],
  ["get", "name_int"],
  ["get", "name"],
];

const islandLabelsSource = {
  type: "geojson" as const,
  data: {
    type: "FeatureCollection" as const,
    features: islandValues.map((island) => ({
      type: "Feature" as const,
      properties: { name: islandLabels[island] },
      geometry: {
        type: "Point" as const,
        coordinates: [islandMapData[island].center[1], islandMapData[island].center[0]],
      },
    })),
  },
};

export function cleanMapStyle(palette: MapPalette): StyleSpecification {
  const text = {
    "text-color": palette.label,
    "text-halo-color": palette.halo,
    "text-halo-width": 1.2,
  };
  return {
    version: 8,
    glyphs: `${OPENFREEMAP}/fonts/{fontstack}/{range}.pbf`,
    sources: {
      openmaptiles: { type: "vector", url: `${OPENFREEMAP}/planet` },
      islands: islandLabelsSource,
    },
    layers: [
      { id: "land", type: "background", paint: { "background-color": palette.land } },
      {
        id: "sea",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "water",
        paint: { "fill-color": palette.sea },
      },
      // Borders between countries on land only: no maritime limits.
      {
        id: "borders",
        type: "line",
        source: "openmaptiles",
        "source-layer": "boundary",
        filter: ["all", ["==", ["get", "admin_level"], 2], ["!=", ["get", "maritime"], 1]],
        paint: {
          "line-color": palette.border,
          "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.4, 8, 1],
        },
      },
      // Streets only once zoomed into a town, and never the ferry routes.
      {
        id: "roads",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 10,
        filter: [
          "in",
          ["get", "class"],
          ["literal", ["motorway", "trunk", "primary", "secondary", "tertiary", "minor"]],
        ],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": palette.road,
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 14, 2.5],
        },
      },
      {
        id: "countries",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        maxzoom: 5,
        filter: ["==", ["get", "class"], "country"],
        layout: {
          "text-field": placeName,
          "text-font": ["Noto Sans Regular"],
          "text-size": 11,
          "text-max-width": 8,
        },
        paint: text,
      },
      {
        id: "towns",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        minzoom: 10,
        filter: ["in", ["get", "class"], ["literal", ["city", "town"]]],
        layout: {
          "text-field": placeName,
          "text-font": ["Noto Sans Regular"],
          "text-size": 11,
        },
        paint: text,
      },
      // Our own island names, under the project markers that sit on each island.
      {
        id: "island-names",
        type: "symbol",
        source: "islands",
        minzoom: 5,
        maxzoom: 11,
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Bold"],
          "text-size": 12,
          "text-anchor": "top",
          "text-offset": [0, 1.9],
          "text-allow-overlap": true,
        },
        paint: text,
      },
    ],
  };
}
