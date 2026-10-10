import { ProjectIcon } from "@/components/project-icon/project-icon";
import { useProjects } from "@/modules/project-list/hooks/use-projects";
import type { Island } from "@hubdigital/shared";
import { Link } from "@tanstack/react-router";
import { ChevronRight, ThumbsUp } from "lucide-react";
import { useMemo, useState } from "react";
import { CaboVerdeMap } from "./cabo-verde-map";

export function ProjectMapView() {
  const { data, isLoading, isError } = useProjects({ period: "all", sort: "upvotes", limit: 100 });
  const [selectedIsland, setSelectedIsland] = useState<Island | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const projects = useMemo(
    () => data?.data.filter((project) => project.location?.country === "cv") ?? [],
    [data],
  );
  const islandProjects = useMemo(
    () =>
      selectedIsland
        ? projects.filter((project) => project.location?.country === "cv" && project.location.island === selectedIsland)
        : [],
    [projects, selectedIsland],
  );
  const activeProject = islandProjects.find((project) => project.id === selectedProjectId) ?? islandProjects[0];

  function selectIsland(island: Island | null) {
    setSelectedIsland(island);
    setSelectedProjectId(null);
  }

  if (isLoading) {
    return <div className="h-full animate-pulse bg-muted" aria-label="A carregar mapa" />;
  }
  if (isError) {
    return <p className="rounded-xl border p-8 text-center text-muted-foreground">Não foi possível carregar o mapa. Tenta novamente mais tarde.</p>;
  }

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <div className="absolute inset-0">
        <CaboVerdeMap
          projects={projects}
          selectedIsland={selectedIsland}
          selectedProjectId={activeProject?.id ?? null}
          onSelectIsland={selectIsland}
          onSelectProject={setSelectedProjectId}
          onClearSelection={() => selectIsland(null)}
        />
        {projects.length === 0 && (
          <div className="absolute inset-x-4 bottom-4 z-[1000] rounded-lg border bg-background/95 p-4 text-center text-sm shadow-lg backdrop-blur sm:right-16">
            Ainda não há projetos publicados com uma ilha de Cabo Verde associada.
          </div>
        )}
      </div>

      {activeProject && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000]">
          <div className="mx-auto max-w-6xl px-3 pb-3 sm:px-6 sm:pb-5">
            <section className="pointer-events-auto mx-auto flex max-w-3xl items-center gap-3 rounded-xl border bg-background/95 p-3 shadow-xl backdrop-blur sm:gap-4 sm:p-4">
              <ProjectIcon iconUrl={activeProject.logoUrl} className="size-11 shrink-0 sm:size-12" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold">{activeProject.name}</p>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <ThumbsUp className="size-3" /> {activeProject.upvoteCount}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{activeProject.shortDescription}</p>
              </div>
              <Link
                to="/projects/$slug"
                params={{ slug: activeProject.slug }}
                className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-2 text-sm font-medium text-primary hover:bg-primary/10 sm:px-3"
              >
                <span className="hidden sm:inline">Ver projeto</span>
                <span className="sm:hidden">Ver</span>
                <ChevronRight className="size-4" />
              </Link>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
