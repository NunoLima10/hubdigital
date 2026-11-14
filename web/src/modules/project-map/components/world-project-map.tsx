import { addBaseTiles } from "@/modules/project-map/tiles";
import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import {
  countryReference,
  formatLocation,
  type Country,
  type ProjectMapRecord,
} from "@hubdigital/shared";
import {
  locationPosition,
  positionLabel,
  matchesMapLocation,
} from "../positions";
import { caboVerdeBounds, islandMapData } from "../islands";
import "leaflet/dist/leaflet.css";
export function WorldProjectMap({
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
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(7);
  const select = useRef(onSelect);
  select.current = onSelect;
  const selectGroup = useRef(onGroupSelect);
  selectGroup.current = onGroupSelect;
  const cameraKey = useRef("");
  const lastFocusedId = useRef(selectedId);
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
      L.control.zoom({ position: "topright" }).addTo(instance);
      instance.fitBounds(caboVerdeBounds);
      instance.on("zoomend", () => setZoom(instance.getZoom()));
      instance.on("moveend", () => {
        if (!cameraKey.current) return;
        try {
          const center = instance.getCenter();
          sessionStorage.setItem(
            cameraKey.current,
            JSON.stringify({
              center: [center.lat, center.lng],
              zoom: instance.getZoom(),
            }),
          );
        } catch {
          /* optional persistence */
        }
      });
      addBaseTiles(L, instance, {
        className: "project-map-tile",
        extraAttribution:
          '<a href="https://github.com/mledoze/countries">Countries (ODbL)</a>',
      });
      observer = new ResizeObserver(() =>
        instance.invalidateSize({ pan: false }),
      );
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
      const color = getComputedStyle(container.current!)
        .getPropertyValue("--primary")
        .trim();
      const regions = new Map<
        string,
        { position: [number, number]; ids: Set<number>; names: string[] }
      >();
      projects.forEach((project) =>
        [project.location, ...project.additionalLocations].forEach(
          (location) => {
            if (!matchesMapLocation(location, world, country, island)) return;
            const countryAggregate = world && zoom <= 4;
            const position: [number, number] = countryAggregate
              ? [...countryReference[location.country].center]
              : locationPosition(location);
            const label = countryAggregate
              ? `${project.name} · ${countryReference[location.country].name} · Agregado por país`
              : `${project.name} · ${formatLocation(location)} · ${positionLabel(location)}`;
            if (
              !countryAggregate &&
              location.publicPin?.precision === "exact"
            ) {
              const marker = L.circleMarker(position, {
                radius: project.id === selectedId ? 22 : 18,
                color: color || "currentColor",
              }).addTo(layer.current!);
              const text = document.createElement("span");
              text.textContent = label;
              marker.bindTooltip(text);
              marker.on("click", () => select.current(project.id));
              const element = marker.getElement();
              if (element) {
                element.setAttribute("tabindex", "0");
                element.setAttribute("role", "button");
                element.setAttribute("aria-label", label);
                element.addEventListener("keydown", (event) => {
                  if (
                    (event as KeyboardEvent).key === "Enter" ||
                    (event as KeyboardEvent).key === " "
                  ) {
                    event.preventDefault();
                    select.current(project.id);
                  }
                });
              }
            } else {
              const key = countryAggregate
                ? location.country
                : position.join(",");
              const group = regions.get(key) ?? {
                position,
                ids: new Set<number>(),
                names: [],
              };
              group.ids.add(project.id);
              group.names.push(label);
              regions.set(key, group);
            }
          },
        ),
      );
      regions.forEach((group) => {
        const marker = L.marker(group.position, {
          icon: L.divIcon({
            className: "project-map-marker-shell",
            html: `<div class="flex size-11 items-center justify-center rounded-full border-2 border-primary ${selectedId && group.ids.has(selectedId) ? "bg-primary text-primary-foreground" : "bg-background text-foreground"} text-sm font-semibold shadow">${group.ids.size}</div>`,
            iconSize: [42, 42],
            iconAnchor: [21, 21],
          }),
          title: `${group.ids.size} projeto(s), localização regional`,
        }).addTo(layer.current!);
        const text = document.createElement("span");
        text.textContent =
          group.names.slice(0, 3).join("; ") +
          (group.names.length > 3
            ? ` (+${group.names.length - 3} localizações)`
            : "");
        marker.bindTooltip(text);
        marker.on("click", () =>
          group.ids.size > 1
            ? selectGroup.current([...group.ids])
            : select.current([...group.ids][0]),
        );
      });
    });
    return () => {
      cancelled = true;
    };
  }, [ready, projects, world, country, island, zoom, selectedId]);
  useEffect(() => {
    if (!ready || !map.current) return;
    cameraKey.current = `hub-map-camera:${world ? "world" : "cv"}:${country}:${island}`;
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(cameraKey.current) ?? "null",
      );
      if (
        saved &&
        Array.isArray(saved.center) &&
        saved.center.length === 2 &&
        saved.center.every(
          (value: unknown) =>
            typeof value === "number" && Number.isFinite(value),
        ) &&
        Number.isFinite(saved.zoom) &&
        saved.zoom >= 2 &&
        saved.zoom <= 18
      ) {
        map.current.setView(saved.center, saved.zoom, { animate: false });
        return;
      }
    } catch {
      /* use the default region */
    }
    if (world && country)
      map.current.setView(
        [...countryReference[country].center],
        country === "cv" ? 8 : 5,
      );
    else if (world) map.current.setView([25, 0], 2);
    else if (island && island in islandMapData)
      map.current.setView(
        islandMapData[island as keyof typeof islandMapData].center,
        9,
      );
    else map.current.fitBounds(caboVerdeBounds);
  }, [ready, world, country, island]);
  useEffect(() => {
    if (!selectedId) {
      lastFocusedId.current = null;
      return;
    }
    if (!map.current || selectedId === lastFocusedId.current) return;
    const project = projects.find((item) => item.id === selectedId);
    const location =
      project &&
      [project.location, ...project.additionalLocations].find((item) =>
        matchesMapLocation(item, world, country, island),
      );
    if (location) {
      lastFocusedId.current = selectedId;
      map.current.setView(
        locationPosition(location),
        location.publicPin
          ? 10
          : location.country === "cv" && location.island
            ? 9
            : 5,
        { animate: false },
      );
    }
  }, [ready, selectedId, projects, world, country, island]);
  return (
    <div
      ref={container}
      className="project-map h-full w-full bg-muted"
      aria-label={
        world ? "Mapa mundial das equipas" : "Mapa das equipas em Cabo Verde"
      }
    />
  );
}
