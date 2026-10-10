import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import type { Project } from "@/modules/submit/types/project";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
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
      <section
        aria-labelledby="first-launch-title"
        className="flex min-h-[320px] flex-col items-center justify-center px-3 py-10 text-center sm:min-h-[380px] sm:px-6"
      >
        <div aria-hidden="true" className="mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Rocket className="size-6" />
        </div>
        <h2 id="first-launch-title" className="max-w-sm text-xl font-semibold tracking-tight sm:text-2xl">
          O teu primeiro lançamento começa aqui
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          Partilha o que estás a criar com a comunidade de Cabo Verde e recebe feedback para dar o próximo passo.
        </p>
        <Link
          to="/dashboard/submit"
          className={buttonVariants({ className: "mt-6 h-auto min-h-11 whitespace-normal px-4 py-3" })}
        >
          Publicar o primeiro projeto
        </Link>
        <p className="mt-3 text-xs text-muted-foreground">
          Podes guardar um rascunho antes de publicar.
        </p>
      </section>
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
