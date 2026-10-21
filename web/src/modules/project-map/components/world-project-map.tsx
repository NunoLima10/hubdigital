import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import {
  countryReference,
  formatLocation,
  type Country,
  type ProjectMapRecord,
} from "@hubdigital/shared";
import { locationPosition, positionLabel, matchesMapLocation } from "../positions";
import { caboVerdeBounds } from "../islands";
import "leaflet/dist/leaflet.css";
export function WorldProjectMap({
  projects,
  world,
  selectedId,
  country = "",
  island = "",
  onSelect,
}: {
  projects: ProjectMapRecord[];
  world: boolean;
  country?: Country | "";
  island?: string;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(7);
  const select = useRef(onSelect);
  select.current = onSelect;
  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    void import("leaflet").then((L) => {
      if (cancelled || !container.current) return;
      const instance = L.map(container.current, {
        minZoom: 2,
        maxZoom: 18,
        worldCopyJump: true,
        zoomControl: false,
      });
      L.control.zoom({ position: "bottomright" }).addTo(instance);
      instance.fitBounds(caboVerdeBounds);
      instance.on("zoomend", () => setZoom(instance.getZoom()));
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://github.com/mledoze/countries">Countries (ODbL)</a>',
        maxZoom: 19,
        className: "project-map-tile",
      }).addTo(instance);
      observer = new ResizeObserver(() => instance.invalidateSize({ pan: false }));
      observer.observe(container.current);
      map.current = instance;
      layer.current = L.layerGroup().addTo(instance);
      setReady(true);
    });
    return () => {
      cancelled = true;
      observer?.disconnect();
      map.current?.remove();
      map.current = null;
      layer.current = null;
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || !map.current || !layer.current) return;
      layer.current.clearLayers();
      const color = getComputedStyle(container.current!).getPropertyValue("--primary").trim();
      const regions = new Map<
        string,
        { position: [number, number]; ids: Set<number>; names: string[] }
      >();
      projects.forEach((project) =>
        [project.location, ...project.additionalLocations].forEach((location) => {
          if (!matchesMapLocation(location, world, country, island)) return;
          const countryAggregate = world && zoom <= 4;
          const position: [number, number] = countryAggregate
            ? [...countryReference[location.country].center]
            : locationPosition(location);
          const label = countryAggregate
            ? `${project.name} · ${countryReference[location.country].name} · Agregado por país`
            : `${project.name} · ${formatLocation(location)} · ${positionLabel(location)}`;
          if (!countryAggregate && location.publicPin?.precision === "exact") {
            const marker = L.circleMarker(position, {
              radius: project.id === selectedId ? 12 : 8,
              color: color || "currentColor",
            }).addTo(layer.current!);
            const text = document.createElement("span");
            text.textContent = label;
            marker.bindTooltip(text);
            marker.on("click", () => select.current(project.id));
          } else {
            const key = countryAggregate ? location.country : position.join(",");
            const group = regions.get(key) ?? { position, ids: new Set<number>(), names: [] };
            group.ids.add(project.id);
            group.names.push(label);
            regions.set(key, group);
          }
        }),
      );
      regions.forEach((group) => {
        const marker = L.marker(group.position, {
          icon: L.divIcon({
            className: "project-map-marker-shell",
            html: `<div class="flex size-10 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-semibold text-foreground shadow">${group.ids.size}</div>`,
            iconSize: [42, 42],
            iconAnchor: [21, 21],
          }),
          title: `${group.ids.size} projeto(s), localização regional`,
        }).addTo(layer.current!);
        const text = document.createElement("span");
        text.textContent =
          group.names.slice(0, 3).join("; ") +
          (group.names.length > 3 ? ` (+${group.names.length - 3} localizações)` : "");
        marker.bindTooltip(text);
        marker.on("click", () => select.current([...group.ids][0]));
      });
    });
    return () => {
      cancelled = true;
    };
  }, [ready, projects, world, country, island, zoom, selectedId]);
  useEffect(() => {
    if (!map.current) return;
    if (world && country)
      map.current.setView([...countryReference[country].center], country === "cv" ? 8 : 5);
    else if (world) map.current.setView([25, 0], 2);
    else map.current.fitBounds(caboVerdeBounds);
  }, [ready, world, country, island]);
  useEffect(() => {
    if (!map.current || !selectedId) return;
    const project = projects.find((item) => item.id === selectedId);
    const location =
      project &&
      [project.location, ...project.additionalLocations].find((item) =>
        matchesMapLocation(item, world, country, island),
      );
    if (location)
      map.current.setView(
        locationPosition(location),
        location.publicPin ? 10 : location.country === "cv" && location.island ? 9 : 5,
      );
  }, [ready, selectedId, projects, world, country, island]);
  return (
    <div
      ref={container}
      className="project-map h-full w-full bg-muted"
      aria-label={world ? "Mapa mundial das equipas" : "Mapa das equipas em Cabo Verde"}
    />
  );
}
