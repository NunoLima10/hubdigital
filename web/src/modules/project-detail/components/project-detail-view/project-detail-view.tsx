import { ProjectBanner } from "@/components/project-banner/project-banner";
import {
  accessLabels,
  audienceLabels,
  businessModelLabels,
  platformLabels,
  pricingLabels,
  projectStageLabels,
} from "@/modules/submit/options";
import { Project } from "@/modules/submit/types/project";
import { CategoriesDisplay } from "@/modules/submit/ui/components/categories-diplay/categories-display";
import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconBrandGithub,
  IconExternalLink,
} from "@tabler/icons-react";
import { ProjectAuthorRow } from "../project-author/project-author";
import classes from "./project-detail-view.module.css";

type ProjectDetailViewProps = {
  project: Project;
};

export function ProjectDetailView({ project }: ProjectDetailViewProps) {
  const categoryBadges = project.category ? [project.category.name] : [];

  return (
    <Stack gap="lg">
      <Flex justify="space-between" align="flex-start" wrap="wrap" gap="md">
        <Stack gap={6}>
          <Title order={2}>{project.name}</Title>
          <ProjectAuthorRow author={project.author} />
        </Stack>
        <Group gap="xs">
          {project.githubUrl && (
            <ActionIcon
              component="a"
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer"
              variant="default"
              size="lg"
              aria-label="GitHub"
            >
              <IconBrandGithub size={18} />
            </ActionIcon>
          )}
          <Button
            component="a"
            href={project.websiteUrl}
            target="_blank"
            rel="noreferrer"
            rightSection={<IconExternalLink size={16} />}
          >
            Visitar site
          </Button>
        </Group>
      </Flex>

      <div className={classes.grid}>
        <ProjectBanner bannerUrl={project.bannerImageUrl} className={classes.banner} />

        <Stack gap="lg">
          <Stack gap="xxs">
            <Text fw={600}>Sobre o projeto</Text>
            {project.description ? (
              <Box dangerouslySetInnerHTML={{ __html: project.description }} />
            ) : (
              <Text c="dimmed">{project.shortDescription}</Text>
            )}
          </Stack>

          <Stack gap="xxs">
            <Text fw={600}>Mais</Text>
            <SimpleGrid cols={{ base: 2, xs: 3 }} spacing="sm">
              <CategoriesDisplay label="Categoria" badges={categoryBadges} />
              <CategoriesDisplay
                label="Preço"
                badges={[pricingLabels[project.pricing]]}
              />
              <CategoriesDisplay
                label="Maturidade"
                badges={[projectStageLabels[project.projectStage]]}
              />
              <CategoriesDisplay
                label="Público-alvo"
                badges={[audienceLabels[project.audienceStage]]}
              />
              <CategoriesDisplay
                label="Modelo de negócio"
                badges={[businessModelLabels[project.businessModel]]}
              />
              <CategoriesDisplay
                label="Acesso"
                badges={[accessLabels[project.access]]}
              />
              <CategoriesDisplay
                label="Plataformas"
                badges={project.platform.map((p) => platformLabels[p])}
              />
            </SimpleGrid>
          </Stack>
        </Stack>
      </div>
    </Stack>
  );
}
