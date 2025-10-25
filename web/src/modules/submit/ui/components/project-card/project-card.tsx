import { Badge, Flex, Stack, Text } from "@mantine/core";
import classes from "./project-card.module.css";

type ProjectCardProps = {
  iconUrl: string;
  websiteUrl: string;
  name: string;
  description: string;
};

export function ProjectCard({
  name,
  iconUrl,
  websiteUrl,
  description,
}: ProjectCardProps) {
  return (
    <Flex gap={"xs"}>
      <img src={iconUrl} className={classes.icon}></img>
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
          <Badge variant="dot" size="sm">
            SaaS
          </Badge>
          <Badge variant="dot" size="sm">
            AI
          </Badge>
          <Badge variant="dot" size="sm">
            B2B
          </Badge>
        </Flex>
      </Stack>
    </Flex>
  );
}
