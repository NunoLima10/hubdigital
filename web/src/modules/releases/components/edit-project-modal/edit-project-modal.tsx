import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  createProjectSchema,
  toCreateProjectPayload,
} from "@/modules/submit/hooks/use-create-project";
import { useUpdateProject } from "@/modules/submit/hooks/use-update-project";
import type {
  CreateProjectInput,
  Project,
} from "@/modules/submit/types/project";
import { locationToFormValue } from "@/modules/submit/utils/location";
import { ProjectCategories } from "@/modules/submit/ui/container/project-categories/project-categories";
import { ProjectForm } from "@/modules/submit/ui/container/project-form/project-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";

function toValues(project: Project): CreateProjectInput {
  return {
    name: project.name,
    shortDescription: project.shortDescription,
    description: project.description ?? "",
    websiteUrl: project.websiteUrl,
    githubUrl: project.githubUrl ?? "",
    logoUrl: undefined,
    bannerImageUrl: undefined,
    pricing: project.pricing,
    platform: project.platform,
    businessModel: project.businessModel,
    access: project.access,
    projectStage: project.projectStage,
    audienceStage: project.audienceStage,
    location: locationToFormValue(project.location),
    categoryId: project.categoryId,
  };
}

export function EditProjectModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={Boolean(project)}
      onClose={onClose}
      title="Editar projeto"
      className="max-h-[90dvh] w-[min(100%-2rem,48rem)] overflow-y-auto"
    >
      {project && (
        <EditProjectForm key={project.id} project={project} onClose={onClose} />
      )}
    </Dialog>
  );
}

function EditProjectForm({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const form = useForm<CreateProjectInput>({
    defaultValues: toValues(project),
    resolver: zodResolver(createProjectSchema, undefined, {
      raw: true,
    }) as Resolver<CreateProjectInput>,
  });
  const { updateProject, isPending } = useUpdateProject({ onSuccess: onClose });
  return (
    <form
      onSubmit={form.handleSubmit((values) =>
        updateProject({
          id: project.id,
          payload: toCreateProjectPayload(values),
        }),
      )}
      className="space-y-6"
    >
      <ProjectForm
        form={form}
        logoPreviewUrl={project.logoUrl ?? undefined}
        bannerPreviewUrl={project.bannerImageUrl ?? undefined}
      />
      <div className="border-t pt-5">
        <ProjectCategories form={form} />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "A guardar..." : "Guardar alterações"}
        </Button>
      </div>
    </form>
  );
}
