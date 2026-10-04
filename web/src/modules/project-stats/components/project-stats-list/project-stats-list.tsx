import { ProjectIcon } from "@/components/project-icon/project-icon";
import { Badge } from "@/components/ui/badge";
import type { ProjectStatsRow } from "@hubdigital/shared";
import { Link } from "@tanstack/react-router";
import { Eye, ExternalLink, Heart, MessageCircle } from "lucide-react";
import { formatCount } from "../../utils/format";

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  pending: "Em revisão",
  published: "No ar",
  rejected: "Rejeitado",
};
export function ProjectStatsList({
  projects,
}: {
  projects: ProjectStatsRow[];
}) {
  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <div
          key={project.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            <ProjectIcon iconUrl={project.logoUrl} className="size-10" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="truncate text-sm">{project.name}</strong>
                <Badge>{statusLabels[project.status] ?? project.status}</Badge>
              </div>
              {project.status === "published" && (
                <Link
                  to="/projects/$slug"
                  params={{ slug: project.slug }}
                  className="text-xs text-primary hover:underline"
                >
                  Ver página
                </Link>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-4">
            {(
              [
                ["Visualizações", project.views, Eye],
                ["Visitas", project.visits, ExternalLink],
                ["Votos", project.upvotes, Heart],
                ["Comentários", project.comments, MessageCircle],
              ] as const
            ).map(([label, value, Icon]) => (
              <div key={label}>
                <strong className="block text-sm tabular-nums">
                  {formatCount(value)}
                </strong>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon className="size-3" />
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
