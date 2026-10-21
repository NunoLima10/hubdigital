import { useEffect, useId, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import {
  countryReference,
  type Country,
  type Island,
  type ProjectLocation,
} from "@hubdigital/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "leaflet/dist/leaflet.css";
import { islandMapData } from "@/modules/project-map/islands";
type Pin = NonNullable<ProjectLocation["publicPin"]>;
export function PublicPinPicker({
  country,
  island,
  value,
  onChange,
}: {
  country: Country;
  island?: Island;
  value: ProjectLocation["publicPin"];
  onChange: (pin: Pin | null) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const callback = useRef(onChange);
  callback.current = onChange;
  const [mode, setMode] = useState<Pin["precision"]>(value?.precision ?? "approximate");
  const precision = useRef(mode);
  precision.current = mode;
  const radioId = useId();
  const [ready, setReady] = useState(false);
  const [latitude, setLatitude] = useState(value ? String(value.latitude) : "");
  const [longitude, setLongitude] = useState(value ? String(value.longitude) : "");
  const [error, setError] = useState("");
  const place = (lat: number, lng: number) =>
    callback.current({
      latitude: precision.current === "approximate" ? Math.round(lat * 10) / 10 : lat,
      longitude: precision.current === "approximate" ? Math.round(lng * 10) / 10 : lng,
      precision: precision.current,
    });
  useEffect(() => {
    let cancelled = false;
    void import("leaflet")
      .then((L) => {
        if (cancelled || !container.current) return;
        const region = country === "cv" && island ? islandMapData[island] : undefined;
        const center: [number, number] = value
          ? [value.latitude, value.longitude]
          : [...(region?.center ?? countryReference[country].center)];
        const zoom = value
          ? value.precision === "exact"
            ? 15
            : 11
          : (region?.zoom ?? (country === "cv" ? 8 : 5));
        const instance = L.map(container.current, {
          minZoom: 2,
          maxZoom: 19,
          worldCopyJump: true,
        }).setView(center, zoom);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(instance);
        instance.on("click", (event) => place(event.latlng.lat, event.latlng.wrap().lng));
        map.current = instance;
        layer.current = L.layerGroup().addTo(instance);
        setReady(true);
      })
      .catch(() => setError("Não foi possível carregar o mapa. Podes usar as coordenadas."));
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      layer.current = null;
    };
    // Country changes remount this picker, preserving a deliberate base location.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    setLatitude(value ? String(value.latitude) : "");
    setLongitude(value ? String(value.longitude) : "");
  }, [value]);
  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || !layer.current) return;
      layer.current.clearLayers();
      if (value) {
        const marker = L.marker([value.latitude, value.longitude], {
          draggable: true,
          title: "Arrastar ponto público",
          icon: L.divIcon({
            className: "",
            html: '<span class="block size-5 rounded-full border-2 border-background bg-primary shadow"></span>',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        }).addTo(layer.current);
        marker.on("dragend", () => {
          const position = marker.getLatLng();
          place(position.lat, position.wrap().lng);
        });
        map.current?.panTo([value.latitude, value.longitude]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ready, value]);
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Clica num local público no mapa. Podes arrastar o ponto para o ajustar.
      </p>
      <div
        ref={container}
        className="isolate h-56 w-full rounded-md bg-muted"
        aria-label="Escolher ponto público no mapa"
      />
      <div className="flex flex-wrap gap-4 text-sm">
        {(["approximate", "exact"] as const).map((mode) => (
          <label key={mode} className="flex items-center gap-2">
            <input
              type="radio"
              name={radioId}
              checked={precision.current === mode}
              onChange={() => {
                setMode(mode);
                precision.current = mode;
                if (value) place(value.latitude, value.longitude);
              }}
            />
            {mode === "exact" ? "Local público exato" : "Aproximado"}
          </label>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {precision.current === "approximate"
          ? "O ponto é arredondado para uma área de cerca de 11 km. Não guardamos as coordenadas exatas."
          : "Escolhe um local público. Evita a tua morada pessoal."}
      </p>
      <details className="space-y-3">
        <summary className="cursor-pointer text-xs text-muted-foreground">
          Introduzir coordenadas
        </summary>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-sm">
            Latitude
            <Input
              type="number"
              step="any"
              min={-90}
              max={90}
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            Longitude
            <Input
              type="number"
              step="any"
              min={-180}
              max={180}
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
          </label>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const lat = Number(latitude),
                lng = Number(longitude);
              if (
                !latitude.trim() ||
                !longitude.trim() ||
                !Number.isFinite(lat) ||
                !Number.isFinite(lng) ||
                Math.abs(lat) > 90 ||
                Math.abs(lng) > 180
              ) {
                setError("Indica latitude e longitude válidas.");
                return;
              }
              setError("");
              place(lat, lng);
            }}
          >
            Aplicar ponto
          </Button>
        </div>
      </details>
      {value && (
        <Button type="button" variant="ghost" onClick={() => onChange(null)}>
          Remover ponto
        </Button>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
