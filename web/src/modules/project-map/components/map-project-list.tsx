import { Link } from "@tanstack/react-router";
import { ProjectIcon } from "@/components/project-icon/project-icon";
import {
  formatLocation,
  type Country,
  type ProjectMapRecord,
} from "@hubdigital/shared";
import { matchesMapLocation, positionLabel } from "../positions";

export function MapProjectList({
  projects,
  selectedId,
  onSelect,
  world,
  country,
  island,
}: {
  projects: ProjectMapRecord[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  world: boolean;
  country: Country | "";
  island: string;
}) {
  return (
    <ul className="space-y-2">
      {projects.map((project) => (
        <li
          key={project.id}
          className={`rounded-md border p-3 ${selectedId === project.id ? "border-primary bg-primary/5" : ""}`}
        >
          <button
            type="button"
            className="flex min-h-11 w-full items-center gap-2 text-left"
            aria-pressed={selectedId === project.id}
            onClick={() => onSelect(project.id)}
          >
            <ProjectIcon
              iconUrl={project.logoUrl}
              className="size-8 shrink-0"
            />
            <span className="text-sm font-medium">{project.name}</span>
          </button>
          <p className="mt-1 text-xs text-muted-foreground">
            {[project.location, ...project.additionalLocations]
              .filter((location) =>
                matchesMapLocation(location, world, country, island),
              )
              .map(
                (location) =>
                  `${formatLocation(location)} · ${positionLabel(location)}`,
              )
              .join("; ") || "Sem localização pública"}
          </p>
          <Link
            to="/projects/$slug"
            params={{ slug: project.slug }}
            className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline"
          >
            Ver projeto
          </Link>
        </li>
      ))}
    </ul>
  );
}
