import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Globe, List, MapIcon, SlidersHorizontal, X } from "lucide-react";
import { mapQueryOptions } from "../map-query";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { CountryFlag } from "@/components/country-flag/country-flag";
import { IslandIcon } from "@/components/island-icon/island-icon";
import { ProjectIcon } from "@/components/project-icon/project-icon";
import {
  SearchSelect,
  type SearchSelectOption,
} from "@/components/search-select/search-select";
import { useCategories } from "@/modules/submit/hooks/use-categories";
import {
  countryLabels,
  countryValues,
  formatLocation,
  islandLabels,
  islandValues,
  type Country,
} from "@hubdigital/shared";
// Prototype: the MapLibre map replaces WorldProjectMap (Leaflet), which stays
// in world-project-map.tsx so switching back is this one import.
import { CleanProjectMap } from "./clean-project-map";
import { MapProjectList } from "./map-project-list";

// Built once: some 250 countries, by name, each with its flag.
const countryOptions: SearchSelectOption[] = [
  {
    value: "",
    label: "Todos os países",
    icon: <Globe className="size-4 text-muted-foreground" />,
  },
  ...[...countryValues]
    .sort((a, b) => countryLabels[a].localeCompare(countryLabels[b], "pt"))
    .map((code) => ({
      value: code,
      label: countryLabels[code],
      icon: <CountryFlag country={code} className="text-sm" />,
    })),
];

export function ProjectMapView() {
  const [world, setWorld] = useState(false);
  const [country, setCountry] = useState<Country | "">("");
  const [island, setIsland] = useState("");
  const [category, setCategory] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [panel, setPanel] = useState<"filters" | "projects" | null>(null);
  const [groupIds, setGroupIds] = useState<number[] | null>(null);
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem("hub-map-explorer") ?? "null",
      );
      if (saved) {
        setWorld(saved.world === true);
        if (countryValues.includes(saved.country)) setCountry(saved.country);
        if (saved.island in islandLabels) setIsland(saved.island);
        if (/^\d+$/.test(saved.category)) setCategory(saved.category);
        if (Number.isInteger(saved.selectedId)) setSelectedId(saved.selectedId);
      }
    } catch {
      /* Map exploration works without session storage. */
    }
    setRestored(true);
  }, []);
  useEffect(() => {
    if (restored)
      try {
        sessionStorage.setItem(
          "hub-map-explorer",
          JSON.stringify({ world, country, island, category, selectedId }),
        );
      } catch {
        /* optional persistence */
      }
  }, [restored, world, country, island, category, selectedId]);
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
  const selected = visible.find((project) => project.id === selectedId);
  const unlocated = visible.filter(
    (project) => !project.location && !project.additionalLocations.length,
  ).length;
  const activeFilters = [world ? country : island, category].filter(
    Boolean,
  ).length;
  const resetSelection = () => {
    setSelectedId(null);
    setGroupIds(null);
  };
  const clearFilters = () => {
    setCountry("");
    setIsland("");
    setCategory("");
    resetSelection();
  };
  const scopeControls = (
    <div className="flex gap-1 rounded-lg border bg-background p-1 shadow-sm">
      <Button
        type="button"
        size="sm"
        variant={world ? "ghost" : "default"}
        aria-pressed={!world}
        className="min-h-11 flex-1"
        onClick={() => {
          setWorld(false);
          setCountry("");
          resetSelection();
        }}
      >
        Cabo Verde
      </Button>
      <Button
        type="button"
        size="sm"
        variant={world ? "default" : "ghost"}
        aria-pressed={world}
        className="min-h-11 flex-1"
        onClick={() => {
          setWorld(true);
          setIsland("");
          resetSelection();
        }}
      >
        <span className="lg:hidden">Mundo</span>
        <span className="hidden lg:inline">Mundo / Diáspora</span>
      </Button>
    </div>
  );
  const filters = (
    <div className="space-y-3">
      {world ? (
        <SearchSelect
          label="Filtrar país"
          value={country}
          options={countryOptions}
          placeholder="Todos os países"
          searchPlaceholder="Pesquisar país…"
          emptyText="Nenhum país encontrado."
          onValueChange={(value) => {
            setCountry(value as Country | "");
            resetSelection();
          }}
        />
      ) : (
        <SearchSelect
          label="Ilha"
          value={island}
          options={[
            {
              value: "",
              label: "Todas as ilhas",
              icon: <MapIcon className="size-5 p-0.5 text-muted-foreground" />,
            },
            ...islandValues.map((value) => ({
              value,
              label: islandLabels[value],
              icon: <IslandIcon island={value} className="size-5 text-muted-foreground" />,
            })),
          ]}
          placeholder="Todas as ilhas"
          searchPlaceholder="Pesquisar ilha…"
          emptyText="Nenhuma ilha encontrada."
          onValueChange={(value) => {
            setIsland(value);
            resetSelection();
          }}
        />
      )}
      <SearchSelect
        label="Categoria"
        value={category}
        options={[
          { value: "", label: "Todas as categorias" },
          ...(categories ?? []).map((item) => ({
            value: String(item.id),
            label: item.name,
          })),
        ]}
        placeholder="Todas as categorias"
        searchPlaceholder="Pesquisar categoria…"
        emptyText="Nenhuma categoria encontrada."
        onValueChange={(value) => {
          setCategory(value);
          resetSelection();
        }}
      />
      {activeFilters > 0 && (
        <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
  const status = (
    <div aria-live="polite" className="text-sm">
      {isLoading ? (
        <p>A carregar projetos…</p>
      ) : isError ? (
        <div className="space-y-2">
          <p>Não foi possível carregar os projetos.</p>
          <Button variant="outline" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : !visible.length ? (
        <div className="space-y-2">
          <p>
            {activeFilters
              ? "Nenhum projeto corresponde a estes filtros."
              : "Ainda não há projetos neste mapa."}
          </p>
          {activeFilters > 0 && (
            <Button size="sm" variant="outline" onClick={clearFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {visible.length} projetos · {unlocated} sem localização pública
        </p>
      )}
    </div>
  );
  const projectList = (mobile: boolean) => (
    <MapProjectList
      projects={
        mobile && groupIds
          ? visible.filter((item) => groupIds.includes(item.id))
          : visible
      }
      selectedId={selectedId}
      world={world}
      country={country}
      island={island}
      onSelect={(id) => {
        setSelectedId(id);
        setGroupIds(null);
        if (mobile) setPanel(null);
      }}
    />
  );
  return (
    <div className="relative flex h-full min-h-0">
      <aside
        className="hidden w-80 shrink-0 flex-col gap-4 overflow-y-auto border-r bg-background p-4 lg:flex"
        aria-label="Projetos no mapa"
      >
        {scopeControls}
        {filters}
        {status}
        {projectList(false)}
      </aside>
      <div className="relative min-h-0 min-w-0 flex-1">
        {restored && (
          <CleanProjectMap
            projects={visible}
            world={world}
            country={world ? country : ""}
            island={world ? "" : island}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              setGroupIds(null);
            }}
            onGroupSelect={(ids) => {
              setGroupIds(ids);
              setPanel("projects");
            }}
          />
        )}
        <div className="absolute inset-x-3 top-3 z-[500] flex items-center gap-2 lg:hidden">
          <div className="min-w-0 flex-1">{scopeControls}</div>
          <Button
            type="button"
            variant="outline"
            className="size-13 shrink-0 bg-background shadow-sm"
            aria-label={`Filtros do mapa${activeFilters ? ` (${activeFilters} ativos)` : ""}`}
            onClick={() => setPanel("filters")}
          >
            <SlidersHorizontal className="size-5" />
            {activeFilters > 0 && (
              <span className="text-xs">{activeFilters}</span>
            )}
          </Button>
        </div>
        <div className="pointer-events-none absolute inset-x-3 bottom-7 z-[500] space-y-2 lg:hidden">
          {selected && (
            <article
              aria-label="Projeto selecionado"
              className="pointer-events-auto flex items-start gap-3 rounded-lg border bg-background p-3 shadow-md [@media(max-height:500px)]:items-center [@media(max-height:500px)]:p-2"
            >
              <ProjectIcon
                iconUrl={selected.logoUrl}
                className="size-10 shrink-0"
              />
              <div className="min-w-0 flex-1 [@media(max-height:500px)]:flex [@media(max-height:500px)]:items-center [@media(max-height:500px)]:gap-3">
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {selected.name}
                </p>
                <p className="truncate text-xs text-muted-foreground [@media(max-height:500px)]:hidden">
                  {selected.location
                    ? formatLocation(selected.location)
                    : "Equipa distribuída"}
                </p>
                <Link
                  to="/projects/$slug"
                  params={{ slug: selected.slug }}
                  className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-primary"
                >
                  Ver projeto
                </Link>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Fechar pré-visualização"
                className="size-11"
                onClick={resetSelection}
              >
                <X />
              </Button>
            </article>
          )}
          {(isError || (!isLoading && !visible.length)) && (
            <div className="pointer-events-auto rounded-lg border bg-background p-3 shadow-sm">
              {status}
            </div>
          )}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              className="pointer-events-auto min-h-11 gap-2 bg-background shadow-md"
              onClick={() => {
                setGroupIds(null);
                setPanel("projects");
              }}
            >
              <List className="size-4" />
              {isLoading ? "A carregar…" : `Ver ${visible.length} projetos`}
            </Button>
          </div>
        </div>
      </div>
      {panel && (
        <Dialog
          open
          onClose={() => {
            setPanel(null);
            setGroupIds(null);
          }}
          title={
            panel === "filters"
              ? "Filtros do mapa"
              : groupIds
                ? "Projetos neste local"
                : "Projetos no mapa"
          }
          className="max-h-[85dvh]"
        >
          {panel === "filters" ? (
            <div className="space-y-5">
              {filters}
              {status}
              <Button
                type="button"
                className="min-h-11 w-full"
                onClick={() => setPanel(null)}
              >
                Ver mapa
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {status}
              {projectList(true)}
            </div>
          )}
        </Dialog>
      )}
    </div>
  );
}
