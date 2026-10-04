import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import type { Project } from "@/modules/submit/types/project";
import { useState } from "react";
import { useMyProjects } from "../../hooks/use-my-projects";
import {
  useDeleteProject,
  usePublishProject,
} from "../../hooks/use-project-actions";
import { EditProjectModal } from "../edit-project-modal/edit-project-modal";
import { ReleasesItem } from "../releases-item/releases-item";

export function ReleasesList() {
  const { data, isLoading, isError } = useMyProjects();
  const showLoading = useDelayedLoading(isLoading);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const { publishProject, pendingProjectId: publishingId } =
    usePublishProject();
  const { deleteProject, pendingProjectId: deletingId } = useDeleteProject({
    onSuccess: () => setDeletingProject(null),
  });
  if (isLoading)
    return showLoading ? (
      <div className="space-y-3">
        {[1, 2].map((n) => (
          <div key={n} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    ) : null;
  if (isError)
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Não foi possível carregar os teus projetos. Tenta novamente mais tarde.
      </p>
    );
  if (!data?.data.length)
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Ainda não publicaste nenhum projeto.
      </p>
    );
  return (
    <>
      <div className="space-y-3">
        {data.data.map((project) => (
          <ReleasesItem
            key={project.id}
            project={project}
            onEdit={setEditingProject}
            onPublish={() => publishProject(project.id)}
            onDelete={setDeletingProject}
            isPublishing={publishingId === project.id}
            isDeleting={deletingId === project.id}
          />
        ))}
      </div>
      <EditProjectModal
        project={editingProject}
        onClose={() => setEditingProject(null)}
      />
      <Dialog
        open={Boolean(deletingProject)}
        onClose={() => setDeletingProject(null)}
        title="Remover projeto"
      >
        <p className="text-sm">
          Queres mesmo remover <strong>{deletingProject?.name}</strong>? Deixará
          de aparecer no site e nos rankings.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="outline"
            disabled={Boolean(deletingId)}
            onClick={() => setDeletingProject(null)}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={Boolean(deletingId)}
            onClick={() => deletingProject && deleteProject(deletingProject.id)}
          >
            {deletingId ? "A remover..." : "Remover"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
