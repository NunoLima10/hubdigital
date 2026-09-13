import { Project } from "@/modules/submit/types/project";
import {
  Button,
  Flex,
  Modal,
  Skeleton,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
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
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const { publishProject, pendingProjectId: publishingId } =
    usePublishProject();
  const { deleteProject, pendingProjectId: deletingId } = useDeleteProject({
    onSuccess: () => setDeletingProject(null),
  });

  if (isLoading) {
    return (
      <SimpleGrid cols={{ base: 1, xl: 2 }} w={"100%"} spacing={"xs"}>
        <Skeleton h={140} radius={"md"} />
        <Skeleton h={140} radius={"md"} />
      </SimpleGrid>
    );
  }

  if (isError) {
    return (
      <Stack align="center" py={"xl"}>
        <Text c={"dimmed"}>
          Não foi possível carregar os teus projetos. Tenta novamente mais
          tarde.
        </Text>
      </Stack>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <Stack align="center" py={"xl"}>
        <Text c={"dimmed"}>Ainda não publicaste nenhum projeto.</Text>
      </Stack>
    );
  }

  return (
    <>
      <SimpleGrid
        cols={{ base: 1, xl: 2 }}
        w={"100%"}
        h={"100%"}
        spacing={"xs"}
      >
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
      </SimpleGrid>

      <EditProjectModal
        project={editingProject}
        onClose={() => setEditingProject(null)}
      />

      <Modal
        opened={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        title="Remover projeto"
        centered
      >
        <Stack>
          <Text size="sm">
            Queres mesmo remover <b>{deletingProject?.name}</b>? Deixará de
            aparecer no site e nos rankings.
          </Text>
          <Flex justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={() => setDeletingProject(null)}
              disabled={!!deletingId}
            >
              Cancelar
            </Button>
            <Button
              color="red"
              loading={!!deletingId}
              onClick={() =>
                deletingProject && deleteProject(deletingProject.id)
              }
            >
              Remover
            </Button>
          </Flex>
        </Stack>
      </Modal>
    </>
  );
}
