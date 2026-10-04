import { Avatar, Badge, Flex, Group, Paper, Stack, Text } from "@mantine/core";
import {
  IconEye,
  IconHeart,
  IconMessageCircle,
  IconRocket,
  IconExternalLink,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import type { ProjectStatsRow } from "@hubdigital/shared";
import { ReactNode } from "react";
import { formatCount } from "../../utils/format";

const statusMeta: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "gray" },
  pending: { label: "Em revisão", color: "yellow" },
  published: { label: "No ar", color: "teal" },
  rejected: { label: "Rejeitado", color: "red" },
};

type ProjectStatsListProps = {
  projects: ProjectStatsRow[];
};

/**
 * One card per project rather than a table: four counters plus a name do not
 * fit a table at phone width, and a card that wraps is the same markup on every
 * screen size.
 */
export function ProjectStatsList({ projects }: ProjectStatsListProps) {
  return (
    <Stack gap="xs">
      {projects.map((project) => {
        const status = statusMeta[project.status] ?? statusMeta.draft;

        return (
          <Paper key={project.id} withBorder p="md" radius="md">
            <Flex gap="md" justify="space-between" wrap="wrap" align="center">
              <Group gap="sm" wrap="nowrap" miw={0} style={{ flex: "1 1 220px" }}>
                <Avatar src={project.logoUrl ?? undefined}>
                  <IconRocket size={18} />
                </Avatar>
                <Stack gap={2} miw={0}>
                  <Group gap="xs" wrap="nowrap">
                    <Text fw={600} lineClamp={1}>
                      {project.name}
                    </Text>
                    <Badge variant="light" color={status.color} size="sm">
                      {status.label}
                    </Badge>
                  </Group>
                  {project.status === "published" && (
                    <Text size="xs" c="dimmed">
                      <Link
                        to="/projects/$slug"
                        params={{ slug: project.slug }}
                        style={{ color: "inherit" }}
                      >
                        Ver página
                      </Link>
                    </Text>
                  )}
                </Stack>
              </Group>

              <Group gap="lg" wrap="wrap">
                <Counter label="Visualizações" icon={<IconEye size={14} />}>
                  {project.views}
                </Counter>
                <Counter label="Visitas" icon={<IconExternalLink size={14} />}>
                  {project.visits}
                </Counter>
                <Counter label="Votos" icon={<IconHeart size={14} />}>
                  {project.upvotes}
                </Counter>
                <Counter label="Comentários" icon={<IconMessageCircle size={14} />}>
                  {project.comments}
                </Counter>
              </Group>
            </Flex>
          </Paper>
        );
      })}
    </Stack>
  );
}

function Counter({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: number;
}) {
  return (
    <Stack gap={0} miw={64}>
      <Text fw={700}>{formatCount(children)}</Text>
      <Text size="xs" c="dimmed" style={{ display: "flex", gap: 4 }}>
        {icon}
        {label}
      </Text>
    </Stack>
  );
}
