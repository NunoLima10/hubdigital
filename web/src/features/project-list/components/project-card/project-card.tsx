import { Badge, Flex, Group, Skeleton, Stack, Text } from "@mantine/core";
import { Link } from "react-router-dom";
import { Project } from "../../types/project";
import { ProjectIcon } from "../project-icon/project-icon";
import { VoteButton } from "../vote-button/vote-button";
import classes from "./project-card.module.css";

type ProjectCardProps = {
  project: Project;
};

export function Projectcard({ project }: ProjectCardProps) {
  const { slug, name, tagline, iconUrl, category, tags, status, upCount } =
    project;

  return (
    <Flex className={classes.card}>
      <Flex gap={"xs"} className={classes.body}>
        <Link
          to={`/projeto/${slug}`}
          aria-label={name}
          className={classes.titleLink}
        >
          <ProjectIcon name={name} iconUrl={iconUrl} className={classes.icon} />
        </Link>
        <Stack gap={0}>
          <Group gap={6}>
            <Link to={`/projeto/${slug}`} className={classes.titleLink}>
              <Text className={classes.title}>{name}</Text>
            </Link>
            {status === "offline" && (
              <Badge size="xs" color="gray" variant="outline">
                Offline
              </Badge>
            )}
          </Group>
          <Text lh={"sm"} fz="xs" lineClamp={2}>
            {tagline}
          </Text>
          <Group gap={5} mt={5} className={classes.topics}>
            <Badge size="xs" variant="filled">
              {category}
            </Badge>
            {tags.map((tag) => (
              <Badge key={tag} size="xs" variant="light">
                {tag}
              </Badge>
            ))}
          </Group>
        </Stack>
      </Flex>
      <VoteButton slug={slug} upCount={upCount} />
    </Flex>
  );
}

function Loading() {
  return (
    <Flex className={classes.card}>
      <Flex gap={"xs"}>
        <Skeleton className={classes.icon} animate={false} />
        <Stack gap={0}>
          <Skeleton
            height={15}
            mt={"sm"}
            width={100}
            radius="xs"
            animate={false}
          />
          <Skeleton
            height={15}
            mt={"sm"}
            width={150}
            radius="xs"
            animate={false}
          />
        </Stack>
      </Flex>
      <Skeleton h={40} w={95} radius="lg" animate={false} />
    </Flex>
  );
}
Projectcard.Loading = Loading;
