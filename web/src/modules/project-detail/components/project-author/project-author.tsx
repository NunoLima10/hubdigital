import type { ProjectAuthor } from "@hubdigital/shared";
import { Avatar, Group, Text } from "@mantine/core";

type ProjectAuthorRowProps = {
  author?: ProjectAuthor | null;
  size?: number;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ProjectAuthorRow({ author, size = 28 }: ProjectAuthorRowProps) {
  if (!author) {
    return (
      <Group gap="xs">
        <Avatar size={size} radius="xl" />
        <Text size="sm" c="dimmed">
          Publicador desconhecido
        </Text>
      </Group>
    );
  }

  return (
    <Group gap="xs">
      <Avatar src={author.image ?? undefined} size={size} radius="xl">
        {getInitials(author.name)}
      </Avatar>
      <Text size="sm" fw={500}>
        {author.name}
      </Text>
    </Group>
  );
}
