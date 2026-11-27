import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { CountryFlag } from "@/components/country-flag/country-flag";
import { IslandIcon } from "@/components/island-icon/island-icon";
import { ProjectIcon } from "@/components/project-icon/project-icon";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatLocation,
  type Country,
  type ProjectLocation,
  type ProjectMapRecord,
} from "@hubdigital/shared";
import { matchesMapLocation, positionLabel } from "../positions";

/** The island's outline in Cabo Verde, the country's flag abroad. */
function LocationIcon({ location }: { location: ProjectLocation }) {
  if (location.country !== "cv")
    return <CountryFlag country={location.country} className="text-xs" />;
  return location.island ? (
    <IslandIcon island={location.island} className="size-4" />
  ) : (
    <MapPin className="size-4 shrink-0" />
  );
}

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
      {projects.map((project) => {
        const selected = selectedId === project.id;
        const locations = [project.location, ...project.additionalLocations].filter(
          (location) => matchesMapLocation(location, world, country, island),
        );
        return (
          <li
            key={project.id}
            className={cn(
              "relative flex gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40",
              selected && "border-primary bg-primary/5 hover:bg-primary/5",
            )}
          >
            <ProjectIcon
              iconUrl={project.logoUrl}
              className="size-12 shrink-0 rounded-lg sm:size-14"
            />
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <button
                type="button"
                className="text-left text-sm leading-5 font-semibold text-pretty outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
                aria-pressed={selected}
                onClick={() => onSelect(project.id)}
              >
                {project.name}
              </button>
              <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                {locations.length ? (
                  locations.map((location, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-1.5"
                      title={positionLabel(location)}
                    >
                      <LocationIcon location={location} />
                      <span className="truncate">{formatLocation(location)}</span>
                    </li>
                  ))
                ) : (
                  <li>Sem localização pública</li>
                )}
              </ul>
            </div>
            {/* Tall enough to tap on a phone, without growing the card on desktop. */}
            <Link
              to="/projects/$slug"
              params={{ slug: project.slug }}
              className={buttonVariants({
                variant: "secondary",
                size: "sm",
                className: "relative z-10 min-h-11 self-center lg:min-h-0",
              })}
            >
              Ver projeto
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
