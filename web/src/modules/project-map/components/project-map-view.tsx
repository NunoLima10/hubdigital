import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { mapQueryOptions } from "../map-query";
import { Button } from "@/components/ui/button";
import { ProjectIcon } from "@/components/project-icon/project-icon";
import { CountryPicker } from "@/modules/submit/ui/components/location-fields/country-picker";
import { FormSelect } from "@/modules/submit/ui/components/form-select/form-select";
import { useCategories } from "@/modules/submit/hooks/use-categories";
import { formatLocation, islandLabels, type Country } from "@hubdigital/shared";
import { WorldProjectMap } from "./world-project-map";
import { positionLabel, matchesMapLocation } from "../positions";
export function ProjectMapView() {
  const [world, setWorld] = useState(false);
  const [country, setCountry] = useState<Country | "">("");
  const [island, setIsland] = useState("");
  const [category, setCategory] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: categories } = useCategories();
  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery(
    mapQueryOptions(
      world ? country || undefined : undefined,
      category ? Number(category) : undefined,
      world ? undefined : island || undefined,
    ),
  );
  const visible = useMemo(
    () =>
      world
        ? data
        : data.filter(
            (project) =>
              [project.location, ...project.additionalLocations].some(
                (location) => location?.country === "cv",
              ) ||
              (!project.location && !project.additionalLocations.length),
          ),
    [data, world],
  );
  const unlocated = visible.filter(
    (project) => !project.location && !project.additionalLocations.length,
  ).length;
  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      <aside
        className="flex max-h-[45%] shrink-0 flex-col gap-3 overflow-y-auto border-b bg-background p-4 md:max-h-full md:w-80 md:border-r md:border-b-0"
        aria-label="Projetos no mapa"
      >
        <div className="flex gap-2">
          <Button
            type="button"
            variant={world ? "outline" : "default"}
            aria-pressed={!world}
            onClick={() => {
              setWorld(false);
              setCountry("");
            }}
          >
            Cabo Verde
          </Button>
          <Button
            type="button"
            variant={world ? "default" : "outline"}
            aria-pressed={world}
            onClick={() => {
              setWorld(true);
              setIsland("");
            }}
          >
            Mundo / Diáspora
          </Button>
        </div>
        {world ? (
          <CountryPicker
            label="Filtrar país"
            placeholder="Todos os países"
            clearLabel="Todos os países"
            value={country}
            onChange={(value) => {
              setCountry(value);
              setSelectedId(null);
            }}
          />
        ) : (
          <FormSelect
            value={island}
            options={[
              { value: "", label: "Todas as ilhas" },
              ...Object.entries(islandLabels).map(([value, label]) => ({ value, label })),
            ]}
            placeholder="Todas as ilhas"
            onValueChange={setIsland}
          />
        )}
        <FormSelect
          value={category}
          options={[
            { value: "", label: "Todas as categorias" },
            ...(categories ?? []).map((item) => ({ value: String(item.id), label: item.name })),
          ]}
          placeholder="Todas as categorias"
          onValueChange={setCategory}
        />
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {visible.length} projetos · {unlocated} sem localização pública
        </p>
        {isLoading && <p className="text-sm">A carregar projetos…</p>}
        {isError && (
          <div>
            <p className="text-sm">Não foi possível carregar os projetos.</p>
            <Button variant="outline" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}
        {!isLoading && !isError && !visible.length && (
          <p className="text-sm text-muted-foreground">Nenhum projeto com estes filtros.</p>
        )}
        <ul className="space-y-2">
          {visible.map((project) => (
            <li
              key={project.id}
              className={`rounded-md border p-3 ${selectedId === project.id ? "border-primary" : ""}`}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 text-left"
                onClick={() => setSelectedId(project.id)}
              >
                <ProjectIcon iconUrl={project.logoUrl} className="size-8" />
                <span className="text-sm font-medium">{project.name}</span>
              </button>
              <p className="mt-1 text-xs text-muted-foreground">
                {[project.location, ...project.additionalLocations]
                  .filter((location) => matchesMapLocation(location, world, country, island))
                  .map((location) =>
                    location ? `${formatLocation(location)} · ${positionLabel(location)}` : "",
                  )
                  .join("; ") || "Sem localização pública"}
              </p>
              <Link
                to="/projects/$slug"
                params={{ slug: project.slug }}
                className="mt-2 inline-block text-xs font-medium text-primary"
              >
                Ver projeto
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <div className="relative min-h-0 flex-1">
        <WorldProjectMap
          projects={visible}
          world={world}
          country={world ? country : ""}
          island={world ? "" : island}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>
    </div>
  );
}
