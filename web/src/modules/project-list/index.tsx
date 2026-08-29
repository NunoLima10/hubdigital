import { ProjectDetailModal } from "@/modules/project-detail/components/project-detail-modal/project-detail-modal";
import { pricingLabels } from "@/modules/submit/options";
import { ProjectMinimal } from "@/modules/submit/types/project";
import { Stack, Text } from "@mantine/core";
import { useState } from "react";
import { useProjects } from "./hooks/use-projects";
import { useToggleUpvote } from "./hooks/use-toggle-upvote";
import { Projectcard } from "./components/project-card/project-card";

function toCardProps(project: ProjectMinimal) {
  return {
    id: project.id,
    slug: project.slug,
    title: project.name,
    description: project.shortDescription,
    website: project.websiteUrl,
    iconUrl: project.logoUrl ?? undefined,
    topis: [project.category?.name, pricingLabels[project.pricing]].filter(
      Boolean
    ) as string[],
    upCount: project.upvoteCount,
    hasUpvoted: project.hasUpvoted,
  };
}

export function ProjectList() {
  const { data, isLoading, isError } = useProjects();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { toggleUpvote, pendingProjectId } = useToggleUpvote();

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
      {data.data.map((project, index) => (
        <Projectcard
          key={project.id}
          {...toCardProps(project)}
          onOpen={() => setSelectedIndex(index)}
          onUpvote={() => toggleUpvote(project.id)}
          isUpvotePending={pendingProjectId === project.id}
        />
      ))}
      <ProjectDetailModal
        projects={data.data}
        index={selectedIndex}
        onIndexChange={setSelectedIndex}
        onClose={() => setSelectedIndex(null)}
      />
    </Stack>
  );
}
