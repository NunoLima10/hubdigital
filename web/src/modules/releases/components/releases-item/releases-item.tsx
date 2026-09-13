import { ModerationNotice } from "@/modules/releases/components/moderation-notice/moderation-notice";
import { Project } from "@/modules/submit/types/project";
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Flex,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconLink,
  IconPencil,
  IconRocket,
  IconTrash,
} from "@tabler/icons-react";

type ReleasesItemProps = {
  project: Project;
  onEdit: (project: Project) => void;
  onPublish: (project: Project) => void;
  onDelete: (project: Project) => void;
  isPublishing?: boolean;
  isDeleting?: boolean;
};

export function ReleasesItem({
  project,
  onEdit,
  onPublish,
  onDelete,
  isPublishing,
  isDeleting,
}: ReleasesItemProps) {
  // Only a draft or a rejected project has anything left for its owner to do.
  // A pending one is out of their hands until a moderator looks at it.
  const canPublish =
    project.status === "draft" || project.status === "rejected";

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
              <Tooltip label="Remover projeto">
                <ActionIcon
                  variant="default"
                  color="red"
                  size={"lg"}
                  loading={isDeleting}
                  onClick={() => onDelete(project)}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Tooltip>
            </Flex>
          </Flex>
          <Flex gap="xs" align="center">
            <Title order={4} lineClamp={1}>
              {project.name}
            </Title>
            <StatusBadge project={project} />
          </Flex>
          <Text size="sm" lineClamp={2} c={"dimmed"}>
            {project.shortDescription}
          </Text>
          {project.category && (
            <Badge variant="light" size="sm" w={"fit-content"}>
              {project.category.name}
            </Badge>
          )}
        </Stack>

        <Stack gap="xs" mt="sm">
          <ModerationNotice project={project} />

          {canPublish && (
            <Button
              leftSection={<IconRocket size={18} />}
              loading={isPublishing}
              onClick={() => onPublish(project)}
            >
              {project.status === "rejected" ? "Voltar a publicar" : "Publicar"}
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

const statusMeta: Record<
  Project["status"],
  { label: string; color: string; variant: string }
> = {
  draft: { label: "Rascunho", color: "gray", variant: "outline" },
  pending: { label: "Em revisão", color: "yellow", variant: "light" },
  published: { label: "No ar", color: "teal", variant: "light" },
  rejected: { label: "Rejeitado", color: "red", variant: "light" },
};

function StatusBadge({ project }: { project: Project }) {
  // A hidden project is still `published` in the database, but calling it "no
  // ar" to the person whose project is not on the air would be a lie.
  if (project.hidden) {
    return (
      <Badge variant="light" color="orange" size="sm">
        Oculto
      </Badge>
    );
  }

  const meta = statusMeta[project.status];

  return (
    <Badge variant={meta.variant} color={meta.color} size="sm">
      {meta.label}
    </Badge>
  );
}
