import { ProjectSummary } from "@/components/project-summary/project-summary";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ModerationNotice } from "@/modules/releases/components/moderation-notice/moderation-notice";
import type { Project } from "@/modules/submit/types/project";
import { Menu } from "@base-ui/react/menu";
import { Link } from "@tanstack/react-router";
import {
  Ellipsis,
  ExternalLink,
  Eye,
  Pencil,
  Rocket,
  Trash2,
} from "lucide-react";

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

const statusClasses: Record<Project["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  pending:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  published:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  rejected: "bg-destructive/10 text-destructive",
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
  const hasPublicPage = project.status === "published" && !project.hidden;

  return (
    <article className="rounded-lg border bg-card p-4 sm:p-5">
      <ProjectSummary
        iconUrl={project.logoUrl}
        className="flex-wrap items-start sm:flex-nowrap sm:items-center"
        actionsClassName="ml-auto w-full flex-wrap justify-end gap-2 sm:w-auto sm:flex-nowrap"
        title={
          <div className="flex flex-wrap items-center gap-2">
            {hasPublicPage ? (
              <Link
                to="/projects/$slug"
                params={{ slug: project.slug }}
                className="font-semibold hover:text-primary hover:underline"
              >
                {project.name}
              </Link>
            ) : (
              <h2 className="font-semibold">{project.name}</h2>
            )}
            <Badge
              className={
                project.hidden
                  ? "bg-destructive/10 text-destructive"
                  : statusClasses[project.status]
              }
            >
              {project.hidden ? "Oculto" : statusLabels[project.status]}
            </Badge>
          </div>
        }
        description={project.shortDescription}
        topics={project.category ? [project.category.name] : []}
        actions={
          <>
            {canPublish && (
              <Button
                size="sm"
                disabled={isPublishing}
                onClick={() => onPublish(project)}
              >
                <Rocket />
                {isPublishing
                  ? "A publicar..."
                  : project.status === "rejected"
                    ? "Voltar a publicar"
                    : "Publicar"}
              </Button>
            )}
            {hasPublicPage && (
              <Link
                to="/projects/$slug"
                params={{ slug: project.slug }}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                )}
              >
                <Eye />
                Ver página
              </Link>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(project)}
            >
              <Pencil />
              Editar
            </Button>
            <Menu.Root>
              <Menu.Trigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Mais ações para ${project.name}`}
                  />
                }
              >
                <Ellipsis />
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner sideOffset={6} align="end">
                  <Menu.Popup className="z-50 min-w-44 rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0">
                    <Menu.LinkItem
                      href={project.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      closeOnClick
                      className="flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm outline-none data-highlighted:bg-muted"
                    >
                      <ExternalLink className="size-4" />
                      Abrir site
                    </Menu.LinkItem>
                    <Menu.Separator className="my-1 h-px bg-border" />
                    <Menu.Item
                      disabled={isDeleting}
                      onClick={() => onDelete(project)}
                      className="flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive outline-none data-highlighted:bg-muted data-disabled:opacity-50"
                    >
                      <Trash2 className="size-4" />
                      Remover projeto
                    </Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </>
        }
      />
      <ModerationNotice project={project} />
    </article>
  );
}
