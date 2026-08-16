import { Project } from "@/modules/submit/types/project";
import {
  ActionIcon,
  Avatar,
  Badge,
  Flex,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconLink, IconPencil, IconRocket } from "@tabler/icons-react";

type ReleasesItemProps = {
  project: Project;
  onEdit: (project: Project) => void;
};

export function ReleasesItem({ project, onEdit }: ReleasesItemProps) {
  return (
    <Paper withBorder p="lg" radius="md">
      <Stack justify="space-between" h={"100%"}>
        <Stack gap={"xxs"}>
          <Flex>
            <Avatar src={project.logoUrl ?? undefined}>
              <IconRocket size={18} />
            </Avatar>
            <Flex w={"100%"} justify={"end"} gap={"xxs"}>
              <ActionIcon
                component="a"
                href={project.websiteUrl}
                target="_blank"
                variant="default"
                size={"lg"}
              >
                <IconLink size={18} />
              </ActionIcon>
              <ActionIcon
                variant="default"
                size={"lg"}
                onClick={() => onEdit(project)}
              >
                <IconPencil size={18} />
              </ActionIcon>
            </Flex>
          </Flex>
          <Title order={4} lineClamp={1}>
            {project.name}
          </Title>
          <Text size="sm" lineClamp={2} c={"dimmed"}>
            {project.shortDescription}
          </Text>
          {project.category && (
            <Badge variant="light" size="sm" w={"fit-content"}>
              {project.category.name}
            </Badge>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
