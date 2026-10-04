import { ProjectIcon } from "@/components/project-icon/project-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModerationNotice } from "@/modules/releases/components/moderation-notice/moderation-notice";
import type { Project } from "@/modules/submit/types/project";
import { ExternalLink, Pencil, Rocket, Trash2 } from "lucide-react";

type Props = {
  project: Project;
  onEdit: (project: Project) => void;
  onPublish: (project: Project) => void;
  onDelete: (project: Project) => void;
  isPublishing?: boolean;
  isDeleting?: boolean;
};
const statusLabels: Record<Project["status"], string> = {
  draft: "Rascunho",
  pending: "Em revisão",
  published: "No ar",
  rejected: "Rejeitado",
};
export function ReleasesItem({
  project,
  onEdit,
  onPublish,
  onDelete,
  isPublishing,
  isDeleting,
}: Props) {
  const canPublish =
    project.status === "draft" || project.status === "rejected";
  return (
    <article className="flex h-full flex-col gap-4 rounded-lg border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <ProjectIcon iconUrl={project.logoUrl} className="size-11" />
        <div className="flex gap-1">
          <a
            href={project.websiteUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir website"
            className="rounded p-2 hover:bg-muted"
          >
            <ExternalLink className="size-4" />
          </a>
          <button
            onClick={() => onEdit(project)}
            aria-label="Editar projeto"
            className="rounded p-2 hover:bg-muted"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => onDelete(project)}
            disabled={isDeleting}
            aria-label="Remover projeto"
            className="rounded p-2 text-destructive hover:bg-muted"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold">{project.name}</h2>
          <Badge>
            {project.hidden ? "Oculto" : statusLabels[project.status]}
          </Badge>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {project.shortDescription}
        </p>
        {project.category && <Badge>{project.category.name}</Badge>}
      </div>
      <ModerationNotice project={project} />
      {canPublish && (
        <Button disabled={isPublishing} onClick={() => onPublish(project)}>
          <Rocket />
          {isPublishing
            ? "A publicar..."
            : project.status === "rejected"
              ? "Voltar a publicar"
              : "Publicar"}
        </Button>
      )}
    </article>
  );
}
