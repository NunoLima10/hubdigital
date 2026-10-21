import { toAssetUrl } from "@/utils/asset-url";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  createProjectSchema,
  toCreateProjectPayload,
} from "@/modules/submit/hooks/use-create-project";
import { useUpdateProject } from "@/modules/submit/hooks/use-update-project";
import type { CreateProjectInput, Project } from "@/modules/submit/types/project";
import { projectToFormValues } from "@/modules/submit/utils/draft";
import { ProjectCategories } from "@/modules/submit/ui/container/project-categories/project-categories";
import { LocationFields } from "@/modules/submit/ui/components/location-fields/location-fields";
import { ProjectForm } from "@/modules/submit/ui/container/project-form/project-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";

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
      className="max-h-[90dvh] max-w-none md:max-w-3xl"
    >
      {project && <EditProjectForm key={project.id} project={project} onClose={onClose} />}
    </Dialog>
  );
}

function EditProjectForm({ project, onClose }: { project: Project; onClose: () => void }) {
  const form = useForm<CreateProjectInput>({
    defaultValues: projectToFormValues(project),
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
        logoPreviewUrl={toAssetUrl(form.watch("logoUrl")) ?? project.logoUrl ?? undefined}
        galleryPreviewUrls={form.watch("galleryImageKeys").map((key) => toAssetUrl(key) ?? "")}
      />
      <div className="border-t pt-5">
        <ProjectCategories form={form} />
      </div>
      <LocationFields form={form} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "A guardar..." : "Guardar alterações"}
        </Button>
      </div>
    </form>
  );
}
