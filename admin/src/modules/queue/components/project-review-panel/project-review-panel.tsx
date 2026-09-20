import { ProjectStatusBadge } from "@/components/status-badge/status-badge";
import { relativeTime } from "@/utils/relative-time";
import { formatLocation, type AdminProject } from "@hubdigital/shared";
import {
  Anchor,
  Badge,
  Card,
  Divider,
  Group,
  Image,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";

/**
 * Renders a submission the way a visitor would see it. A moderator has to judge
 * what will actually go on the site, so this deliberately shows the banner, the
 * logo and the full description rather than a row of fields.
 */
export function ProjectReviewPanel({ project }: { project: AdminProject }) {
  return (
    <Stack gap="md">
      {project.bannerImageUrl && (
        <Image
          src={project.bannerImageUrl}
          alt=""
          h={160}
          fit="cover"
          radius="md"
        />
      )}

      <Group gap="md" wrap="nowrap" align="flex-start">
        {project.logoUrl && (
          <Image src={project.logoUrl} alt="" w={56} h={56} radius="md" />
        )}
        <Stack gap={4}>
          <Group gap="xs">
            <Title order={4}>{project.name}</Title>
            <ProjectStatusBadge status={project.status} />
          </Group>
          <Text size="sm" c="dimmed">
            {project.shortDescription}
          </Text>
          <Anchor href={project.websiteUrl} target="_blank" size="sm">
            <Group gap={4}>
              {project.websiteUrl}
              <IconExternalLink size={14} />
            </Group>
          </Anchor>
        </Stack>
      </Group>

      <Group gap="xs">
        {project.category && (
          <Badge variant="light">{project.category.name}</Badge>
        )}
        {project.location && (
          <Badge variant="outline">{formatLocation(project.location)}</Badge>
        )}
        {project.githubUrl && (
          <Anchor href={project.githubUrl} target="_blank" size="xs">
            GitHub
          </Anchor>
        )}
      </Group>

      {project.description && (
        <>
          <Divider label="Descrição" labelPosition="left" />
          {/* The maker writes this in a rich-text editor, so it arrives as HTML. */}
          <Card withBorder padding="sm">
            <div
              dangerouslySetInnerHTML={{ __html: project.description }}
              style={{ fontSize: "var(--mantine-font-size-sm)" }}
            />
          </Card>
        </>
      )}

      <Divider label="Autor" labelPosition="left" />

      <Stack gap={2}>
        <Text size="sm">
          {project.publisher?.user.name ?? "—"}{" "}
          <Text span c="dimmed" size="sm">
            · {project.publisher?.user.email}
          </Text>
        </Text>
        <Text size="xs" c="dimmed">
          {project.publisher?.bio}
        </Text>
      </Stack>

      <Group gap="lg">
        <Text size="xs" c="dimmed">
          Submetido {relativeTime(project.createdAt)}
        </Text>
        {project.queuedAt && (
          <Text size="xs" c="dimmed">
            Na fila desde {relativeTime(project.queuedAt)}
          </Text>
        )}
      </Group>
    </Stack>
  );
}
