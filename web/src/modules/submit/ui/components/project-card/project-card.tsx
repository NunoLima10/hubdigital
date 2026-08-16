import { ProjectIcon } from "@/components/project-icon/project-icon";
import { Badge, Flex, Stack, Text } from "@mantine/core";
import classes from "./project-card.module.css";

type ProjectCardProps = {
  iconUrl?: string;
  websiteUrl: string;
  name: string;
  description: string;
  badges?: string[];
};

export function ProjectCard({
  name,
  iconUrl,
  websiteUrl,
  description,
  badges = [],
}: ProjectCardProps) {
  return (
    <Flex gap={"xs"}>
      <ProjectIcon iconUrl={iconUrl} className={classes.icon} size={70} />
      <Stack gap={"none"}>
        <Text
          className={classes.titleLink}
          lh={"sm"}
          fw={500}
          component="a"
          href={websiteUrl}
          target="_blank"
        >
          {name}
        </Text>
        <Text size="sm">{description}</Text>
        <Flex gap={"xs"} visibleFrom="xs">
          {badges.map((badge) => (
            <Badge key={badge} variant="dot" size="sm">
              {badge}
            </Badge>
          ))}
        </Flex>
      </Stack>
    </Flex>
  );
}
