import type { Island } from "@hubdigital/shared";

export type IslandMapData = {
  center: [number, number];
  zoom: number;
};

/** Geographic centres used to focus the map; project records currently identify an island, not a street coordinate. */
export const islandMapData: Record<Island, IslandMapData> = {
  CV1: { center: [17.067, -25.171], zoom: 11 },
  CV2: { center: [16.84, -24.97], zoom: 12 },
  CV3: { center: [16.604, -24.277], zoom: 11 },
  CV4: { center: [16.726, -22.929], zoom: 11 },
  CV5: { center: [16.106, -22.804], zoom: 11 },
  CV6: { center: [15.216, -23.167], zoom: 11 },
  CV7: { center: [15.026, -23.615], zoom: 10 },
  CV8: { center: [14.93, -24.385], zoom: 11 },
  CV9: { center: [14.87, -24.702], zoom: 12 },
};

export const caboVerdeBounds: [[number, number], [number, number]] = [
  [14.72, -25.42],
  [17.22, -22.55],
];

/** Gives island-only records stable, nearby positions without pretending they are exact addresses. */
export function projectPosition(island: Island, projectId: number): [number, number] {
  const [lat, lng] = islandMapData[island].center;
  const angle = ((projectId * 137.508) % 360) * (Math.PI / 180);
  const ring = 0.012 + (projectId % 4) * 0.006;

  return [lat + Math.sin(angle) * ring, lng + Math.cos(angle) * ring];
}
