import {
  createProjectSchema,
  toCreateProjectPayload,
} from "@/modules/submit/hooks/use-create-project";
import { useUpdateProject } from "@/modules/submit/hooks/use-update-project";
import { CreateProjectInput, Project } from "@/modules/submit/types/project";
import { ProjectCategories } from "@/modules/submit/ui/container/project-categories/project-categories";
import { ProjectForm } from "@/modules/submit/ui/container/project-form/project-form";
import { Button, Divider, Flex, Modal, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";

type EditProjectModalProps = {
  project: Project | null;
  onClose: () => void;
};

function projectToFormValues(project: Project): CreateProjectInput {
  return {
    name: project.name,
    shortDescription: project.shortDescription,
    description: project.description ?? "",
    websiteUrl: project.websiteUrl,
    githubUrl: project.githubUrl ?? "",
    // Left undefined on purpose: the API hands back resolved public URLs, not the
    // storage keys the form submits. Undefined means "keep the saved image"; the
    // selector shows it via previewUrl until the maker replaces or removes it.
    logoUrl: undefined,
    bannerImageUrl: undefined,
    pricing: project.pricing,
    platform: project.platform,
    businessModel: project.businessModel,
    access: project.access,
    projectStage: project.projectStage,
    audienceStage: project.audienceStage,
    island: project.island ?? "",
    categoryId: project.categoryId,
  };
}

export function EditProjectModal({ project, onClose }: EditProjectModalProps) {
  return (
    <Modal
      opened={!!project}
      onClose={onClose}
      title="Editar projeto"
      size="lg"
      centered
    >
      {project && <EditProjectForm project={project} onClose={onClose} />}
    </Modal>
  );
}

type EditProjectFormProps = {
  project: Project;
  onClose: () => void;
};

function EditProjectForm({ project, onClose }: EditProjectFormProps) {
  const form = useForm<CreateProjectInput>({
    initialValues: projectToFormValues(project),
    validate: zodResolver(createProjectSchema),
  });

  const { updateProject, isPending } = useUpdateProject({
    onSuccess: onClose,
  });

  function handleSubmit() {
    const result = form.validate();
    if (result.hasErrors) return;

    updateProject({
      id: project.id,
      payload: toCreateProjectPayload(form.values),
    });
  }

  return (
    <Stack>
      <ProjectForm
        form={form}
        logoPreviewUrl={project.logoUrl ?? undefined}
        bannerPreviewUrl={project.bannerImageUrl ?? undefined}
      />
      <Divider label="Categoria" labelPosition="left" />
      <ProjectCategories form={form} />
      <Flex justify="flex-end" gap="sm" mt="md">
        <Button variant="default" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} loading={isPending}>
          Guardar alterações
        </Button>
      </Flex>
    </Stack>
  );
}
