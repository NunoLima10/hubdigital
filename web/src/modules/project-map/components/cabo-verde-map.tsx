import type { ProjectMinimal } from "@/modules/submit/types/project";
import type { Island } from "@hubdigital/shared";
import { islandLabels } from "@hubdigital/shared";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { caboVerdeBounds, islandMapData, projectPosition } from "../islands";

type Props = {
  projects: ProjectMinimal[];
  selectedIsland: Island | null;
  selectedProjectId: number | null;
  onSelectIsland: (island: Island) => void;
  onSelectProject: (projectId: number) => void;
  onClearSelection: () => void;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

function markerHtml(project: ProjectMinimal, selected: boolean, count?: number) {
  const image = project.logoUrl
    ? `<img src="${escapeHtml(project.logoUrl)}" alt="" />`
    : `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.87 12.87 0 0 1 22 2c0 2.72-.78 7.5-6.05 11a22.4 22.4 0 0 1-3.95 2Z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/><circle cx="16" cy="8" r="1"/></svg>`;
  const badge = count && count > 1 ? `<b>${count}</b>` : "";
  return `<div class="project-map-marker${selected ? " is-selected" : ""}">${image}${badge}</div>`;
}

export function CaboVerdeMap({
  projects,
  selectedIsland,
  selectedProjectId,
  onSelectIsland,
  onSelectProject,
  onClearSelection,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const callbacksRef = useRef({ onSelectIsland, onSelectProject, onClearSelection });
  callbacksRef.current = { onSelectIsland, onSelectProject, onClearSelection };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    void import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;
      const map = L.map(containerRef.current, {
        zoomControl: false,
        minZoom: 7,
        maxZoom: 15,
        maxBoundsViscosity: 0.8,
      });
      L.control.zoom({ position: "bottomright" }).addTo(map);
      map.fitBounds(caboVerdeBounds, { padding: [24, 24] });
      map.setMaxBounds([
        [13.7, -26.5],
        [18.1, -21.6],
      ]);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
        className: "project-map-tile",
      }).addTo(map);
      markerLayerRef.current = L.layerGroup().addTo(map);
      map.on("click", () => callbacksRef.current.onClearSelection());
      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || !mapRef.current || !markerLayerRef.current) return;
      const map = mapRef.current;
      const layer = markerLayerRef.current;
      layer.clearLayers();

      if (selectedIsland) {
        const islandProjects = projects.filter(
          (project) => project.location?.country === "cv" && project.location.island === selectedIsland,
        );
        islandProjects.forEach((project) => {
          const marker = L.marker(projectPosition(selectedIsland, project.id), {
            title: project.name,
            alt: project.name,
            icon: L.divIcon({
              className: "project-map-marker-shell",
              html: markerHtml(project, project.id === selectedProjectId),
              iconSize: [42, 42],
              iconAnchor: [21, 21],
            }),
          });
          marker.bindTooltip(`${escapeHtml(project.name)} · ${project.upvoteCount} votos`, {
            direction: "top",
            offset: [0, -22],
          });
          marker.on("click", () => callbacksRef.current.onSelectProject(project.id));
          marker.addTo(layer);
        });
        const island = islandMapData[selectedIsland];
        map.flyTo(island.center, island.zoom, { duration: 0.7 });
        return;
      }

      const topByIsland = new Map<Island, ProjectMinimal>();
      for (const project of projects) {
        if (project.location?.country !== "cv") continue;
        if (!topByIsland.has(project.location.island)) topByIsland.set(project.location.island, project);
      }
      for (const [island, project] of topByIsland) {
        const count = projects.filter(
          (candidate) => candidate.location?.country === "cv" && candidate.location.island === island,
        ).length;
        const marker = L.marker(islandMapData[island].center, {
          title: `${islandLabels[island]}: ${project.name}`,
          alt: `Ver projetos de ${islandLabels[island]}`,
          icon: L.divIcon({
            className: "project-map-marker-shell",
            html: markerHtml(project, false, count),
            iconSize: [42, 42],
            iconAnchor: [21, 21],
          }),
        });
        marker.bindTooltip(
          `<strong>${escapeHtml(islandLabels[island])}</strong><br>${escapeHtml(project.name)} · ${project.upvoteCount} votos`,
          { direction: "top", offset: [0, -22] },
        );
        marker.on("click", () => callbacksRef.current.onSelectIsland(island));
        marker.addTo(layer);
      }
      map.flyToBounds(caboVerdeBounds, { padding: [24, 24], duration: 0.7 });
    });
    return () => {
      cancelled = true;
    };
  }, [mapReady, projects, selectedIsland, selectedProjectId]);

  return (
    <div
      ref={containerRef}
      className="project-map h-full min-h-0 w-full bg-muted"
      aria-label="Mapa interativo dos projetos de Cabo Verde"
    />
  );
}
