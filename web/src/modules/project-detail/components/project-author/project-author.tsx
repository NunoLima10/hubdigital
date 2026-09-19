import type { ProjectAuthor } from "@hubdigital/shared";
import { Anchor, Avatar, Group, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";

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
      {/* Only publishers have a profile page; a plain commenter has no handle. */}
      {author.handle ? (
        <Anchor
          renderRoot={(props) => (
            <Link
              to="/makers/$handle"
              params={{ handle: author.handle as string }}
              {...props}
            />
          )}
          size="sm"
          fw={500}
        >
          {author.name}
        </Anchor>
      ) : (
        <Text size="sm" fw={500}>
          {author.name}
        </Text>
      )}
    </Group>
  );
}
