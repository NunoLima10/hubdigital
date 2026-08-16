import { Project } from "@/modules/submit/types/project";
import { Skeleton, SimpleGrid, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { useMyProjects } from "../../hooks/use-my-projects";
import { EditProjectModal } from "../edit-project-modal/edit-project-modal";
import { ReleasesItem } from "../releases-item/releases-item";

export function ReleasesList() {
  const { data, isLoading, isError } = useMyProjects();
  const [editingProject, setEditingProject] = useState<Project | null>(null);

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
          />
        ))}
      </SimpleGrid>
      <EditProjectModal
        project={editingProject}
        onClose={() => setEditingProject(null)}
      />
    </>
  );
}
