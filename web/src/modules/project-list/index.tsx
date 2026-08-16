import { pricingLabels } from "@/modules/submit/options";
import { ProjectMinimal } from "@/modules/submit/types/project";
import { Stack, Text } from "@mantine/core";
import { useProjects } from "./hooks/use-projects";
import { Projectcard } from "./components/project-card/project-card";

function toCardProps(project: ProjectMinimal) {
  return {
    id: project.id,
    title: project.name,
    description: project.shortDescription,
    website: project.websiteUrl,
    iconUrl: project.logoUrl ?? undefined,
    topis: [project.category?.name, pricingLabels[project.pricing]].filter(
      Boolean
    ) as string[],
    upCount: 0,
  };
}

export function ProjectList() {
  const { data, isLoading, isError } = useProjects();

  if (isLoading) {
    return (
      <Stack gap={40}>
        <Projectcard.Loading />
        <Projectcard.Loading />
        <Projectcard.Loading />
      </Stack>
    );
  }

  if (isError) {
    return (
      <Stack align="center" py="xl">
        <Text c="dimmed">
          Não foi possível carregar os projetos. Tenta novamente mais tarde.
        </Text>
      </Stack>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <Stack align="center" py="xl">
        <Text c="dimmed">
          Ainda não há projetos publicados. Sê o primeiro a partilhar o teu!
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap={40}>
      {data.data.map((project) => (
        <Projectcard key={project.id} {...toCardProps(project)} />
      ))}
    </Stack>
  );
}
