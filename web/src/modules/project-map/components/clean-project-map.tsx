import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
// MapLibre runs its tile work in a separate worker file; Vite serves it by URL.
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  countryReference,
  formatLocation,
  type Country,
  type ProjectMapRecord,
} from "@hubdigital/shared";
import { cn } from "@/lib/utils";
import { locationPosition, matchesMapLocation, positionLabel } from "../positions";
import { caboVerdeBounds, islandMapData } from "../islands";
import { cleanMapStyle, readPalette } from "../map-style";

type LngLat = [number, number];
type MapLibre = typeof import("maplibre-gl");

/** Our positions are [lat, lng]; MapLibre wants [lng, lat]. */
const lngLat = ([lat, lng]: readonly [number, number]): LngLat => [lng, lat];
const cvBounds: [LngLat, LngLat] = [lngLat(caboVerdeBounds[0]), lngLat(caboVerdeBounds[1])];
const CV_PADDING = 32;
// MapLibre zoom runs one step below Leaflet's for the same view (512px tiles),
// so these are the old map's levels minus one.
const MIN_ZOOM = 1;
const MAX_ZOOM = 17;
const COUNTRY_GROUPING_MAX_ZOOM = 3;

type MarkerSpec = {
  position: LngLat;
  label: string;
  /** A count bubble for a region, a plain dot for an exact public location. */
  count: number | null;
  selected: boolean;
  activate: () => void;
};

function markerElement(spec: MarkerSpec) {
  // MapLibre moves the outer element with `transform`; the look and the hover
  // growth live on the inner one so they never fight over it.
  const element = document.createElement("div");
  const body = document.createElement("div");
  body.className = cn(
    "border-2 border-primary shadow-md transition-[scale] duration-150 hover:scale-110",
    spec.count === null
      ? cn("size-8 rounded-full", spec.selected ? "bg-primary" : "bg-primary/30")
      : cn(
          "flex size-11 items-center justify-center rounded-full text-sm font-semibold",
          spec.selected ? "bg-primary text-primary-foreground" : "bg-background text-foreground",
        ),
  );
  if (spec.count !== null) body.textContent = String(spec.count);
  element.appendChild(body);
  element.tabIndex = 0;
  element.setAttribute("role", "button");
  element.setAttribute("aria-label", spec.label);
  element.addEventListener("click", (event) => {
    event.stopPropagation();
    spec.activate();
  });
  element.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    spec.activate();
  });
  return element;
}

export function CleanProjectMap({
  projects,
  world,
  selectedId,
  country = "",
  island = "",
  onSelect,
  onGroupSelect,
}: {
  projects: ProjectMapRecord[];
  world: boolean;
  country?: Country | "";
  island?: string;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onGroupSelect: (ids: number[]) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const lib = useRef<MapLibre | null>(null);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(6);
  const select = useRef(onSelect);
  select.current = onSelect;
  const selectGroup = useRef(onGroupSelect);
  selectGroup.current = onGroupSelect;
  const cameraKey = useRef("");
  const lastFocusedId = useRef(selectedId);

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | undefined;
    let themeObserver: MutationObserver | undefined;
    void import("maplibre-gl").then((maplibre) => {
      const element = container.current;
      if (cancelled || !element) return;
      maplibre.setWorkerUrl(workerUrl);
      const instance = new maplibre.Map({
        container: element,
        style: cleanMapStyle(readPalette(element)),
        bounds: cvBounds,
        fitBoundsOptions: { padding: CV_PADDING },
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        // A flat, north-up map: no rotating or tilting by accident.
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        attributionControl: false,
      });
      instance.touchZoomRotate.disableRotation();
      instance.keyboard.disableRotation();
      instance.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
      instance.addControl(
        new maplibre.AttributionControl({
          compact: true,
          customAttribution: '<a href="https://github.com/mledoze/countries">Countries (ODbL)</a>',
        }),
        "bottom-right",
      );
      // Start with the credits folded into the (i) button, so they never sit
      // under the "Ver projetos" button on a phone.
      instance.once("idle", () =>
        element
          .querySelector(".maplibregl-ctrl-attrib")
          ?.classList.remove("maplibregl-compact-show"),
      );
      instance.on("zoomend", () => setZoom(Math.round(instance.getZoom())));
      instance.on("moveend", () => {
        if (!cameraKey.current) return;
        try {
          const center = instance.getCenter();
          sessionStorage.setItem(
            cameraKey.current,
            JSON.stringify({ center: [center.lng, center.lat], zoom: instance.getZoom() }),
          );
        } catch {
          /* optional persistence */
        }
      });
      resizeObserver = new ResizeObserver(() => instance.resize());
      resizeObserver.observe(element);
      // Repaint in the other theme's colours when light/dark is switched.
      let dark = document.documentElement.classList.contains("dark");
      themeObserver = new MutationObserver(() => {
        const nowDark = document.documentElement.classList.contains("dark");
        if (nowDark === dark) return;
        dark = nowDark;
        instance.setStyle(cleanMapStyle(readPalette(element)));
      });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      lib.current = maplibre;
      map.current = instance;
      setZoom(Math.round(instance.getZoom()));
      setReady(true);
    });
    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      themeObserver?.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const maplibre = lib.current;
    const instance = map.current;
    if (!ready || !maplibre || !instance) return;
    const specs: MarkerSpec[] = [];
    const regions = new Map<string, { position: LngLat; ids: Set<number>; names: string[] }>();
    const groupByCountry = world && zoom <= COUNTRY_GROUPING_MAX_ZOOM;
    projects.forEach((project) =>
      [project.location, ...project.additionalLocations].forEach((location) => {
        if (!matchesMapLocation(location, world, country, island)) return;
        const position = groupByCountry
          ? lngLat(countryReference[location.country].center)
          : lngLat(locationPosition(location));
        const label = groupByCountry
          ? `${project.name} · ${countryReference[location.country].name} · Agregado por país`
          : `${project.name} · ${formatLocation(location)} · ${positionLabel(location)}`;
        if (!groupByCountry && location.publicPin?.precision === "exact") {
          specs.push({
            position,
            label,
            count: null,
            selected: project.id === selectedId,
            activate: () => select.current(project.id),
          });
          return;
        }
        const key = groupByCountry ? location.country : position.join(",");
        const group = regions.get(key) ?? { position, ids: new Set<number>(), names: [] };
        group.ids.add(project.id);
        group.names.push(label);
        regions.set(key, group);
      }),
    );
    regions.forEach((group) => {
      const ids = [...group.ids];
      specs.push({
        position: group.position,
        label:
          group.names.slice(0, 3).join("; ") +
          (group.names.length > 3 ? ` (+${group.names.length - 3} localizações)` : ""),
        count: ids.length,
        selected: selectedId !== null && group.ids.has(selectedId),
        activate: () => (ids.length > 1 ? selectGroup.current(ids) : select.current(ids[0])),
      });
    });

    const placed = specs.map((spec) => {
      const element = markerElement(spec);
      const popup = new maplibre.Popup({
        closeButton: false,
        closeOnClick: false,
        anchor: "bottom",
        offset: spec.count === null ? 18 : 26,
        maxWidth: "260px",
        className: "project-map-popup",
      }).setText(spec.label);
      const show = () => popup.setLngLat(spec.position).addTo(instance);
      const hide = () => popup.remove();
      element.addEventListener("mouseenter", show);
      element.addEventListener("mouseleave", hide);
      element.addEventListener("focus", show);
      element.addEventListener("blur", hide);
      const marker = new maplibre.Marker({ element }).setLngLat(spec.position).addTo(instance);
      return { marker, popup };
    });
    return () =>
      placed.forEach(({ marker, popup }) => {
        popup.remove();
        marker.remove();
      });
  }, [ready, projects, world, country, island, zoom, selectedId]);

  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance) return;
    cameraKey.current = `hub-map-camera-v2:${world ? "world" : "cv"}:${country}:${island}`;
    try {
      const saved = JSON.parse(sessionStorage.getItem(cameraKey.current) ?? "null");
      if (
        saved &&
        Array.isArray(saved.center) &&
        saved.center.length === 2 &&
        saved.center.every((value: unknown) => typeof value === "number" && Number.isFinite(value)) &&
        Number.isFinite(saved.zoom) &&
        saved.zoom >= MIN_ZOOM &&
        saved.zoom <= MAX_ZOOM
      ) {
        instance.jumpTo({ center: saved.center, zoom: saved.zoom });
        return;
      }
    } catch {
      /* use the default region */
    }
    if (world && country)
      instance.jumpTo({
        center: lngLat(countryReference[country].center),
        zoom: country === "cv" ? 7 : 4,
      });
    else if (world) instance.jumpTo({ center: [0, 25], zoom: 1 });
    else if (island && island in islandMapData)
      instance.jumpTo({
        center: lngLat(islandMapData[island as keyof typeof islandMapData].center),
        zoom: 8,
      });
    else instance.fitBounds(cvBounds, { padding: CV_PADDING, animate: false });
  }, [ready, world, country, island]);

  useEffect(() => {
    if (!selectedId) {
      lastFocusedId.current = null;
      return;
    }
    const instance = map.current;
    if (!instance || selectedId === lastFocusedId.current) return;
    const project = projects.find((item) => item.id === selectedId);
    const location =
      project &&
      [project.location, ...project.additionalLocations].find((item) =>
        matchesMapLocation(item, world, country, island),
      );
    if (!location) return;
    lastFocusedId.current = selectedId;
    instance.jumpTo({
      center: lngLat(locationPosition(location)),
      zoom: location.publicPin ? 9 : location.country === "cv" && location.island ? 8 : 4,
    });
  }, [ready, selectedId, projects, world, country, island]);

  return (
    <div
      ref={container}
      className="project-map h-full w-full bg-muted"
      aria-label={world ? "Mapa mundial das equipas" : "Mapa das equipas em Cabo Verde"}
    />
  );
}
