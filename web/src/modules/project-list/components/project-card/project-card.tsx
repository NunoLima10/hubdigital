import { ProjectIcon } from "@/components/project-icon/project-icon";
import {
  Anchor,
  Badge,
  Button,
  Flex,
  Group,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";
import { IconConfetti } from "@tabler/icons-react";
import classes from "./project-card.module.css";

import { useMediaQuery } from "@mantine/hooks";
import { useReward } from "react-rewards";
import { Project } from "../../types/project";

type ProjectcardProps = Project & {
  onOpen?: () => void;
  onUpvote?: () => void;
  isUpvotePending?: boolean;
};

export function Projectcard({
  id,
  title,
  description,
  iconUrl,
  topis,
  upCount,
  hasUpvoted,
  website,
  onOpen,
  onUpvote,
  isUpvotePending,
}: ProjectcardProps) {
  // Equivalent to $mantine-breakpoint-xs -> 36em
  const rewardId = "rewardId" + id.toString();

  const isRowButton = useMediaQuery("(min-width: 36em)");

  const { reward } = useReward(rewardId, "confetti", {
    // lifetime is a frame count (at 60fps), not milliseconds — 120 ≈ 2s
    lifetime: 120,
  });

  function onClickUp() {
    if (!hasUpvoted) reward();
    onUpvote?.();
  }

  return (
    <Flex className={classes.card}>
      <Flex
        gap={"xs"}
        className={onOpen ? classes.clickable : undefined}
        onClick={onOpen}
        role={onOpen ? "button" : undefined}
        tabIndex={onOpen ? 0 : undefined}
      >
        <ProjectIcon iconUrl={iconUrl} className={classes.icon} />
        <Stack gap={0}>
          <Anchor
            className={classes.titleLink}
            href={website}
            target="_blank"
            onClick={(event) => event.stopPropagation()}
          >
            <Text className={classes.title}>{title}</Text>
          </Anchor>
          <Text lh={"sm"} fz="xs">
            {description}
          </Text>
          <Group gap={5} mt={5} className={classes.topics}>
            {topis.map((topic, index) => {
              return (
                <Badge key={index} size="xs" variant="light">
                  {topic}
                </Badge>
              );
            })}
          </Group>
        </Stack>
      </Flex>
      {!isRowButton && <span id={rewardId} />}

      <Button
        variant={hasUpvoted ? "light" : "default"}
        color={hasUpvoted ? "orange" : undefined}
        className={classes.upvotetest}
        leftSection={isRowButton ? <span id={rewardId} /> : null}
        rightSection={<IconConfetti size={18} className={classes.upvoteIcon} />}
        classNames={{
          inner: classes.inner,
          root: classes.root,
          section: classes.section,
          label: classes.label,
        }}
        onClick={onClickUp}
        disabled={isUpvotePending}
      >
        <Text size="sm">{upCount}</Text>
      </Button>
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
      <Skeleton h={40} className={classes.root} animate={false} />
    </Flex>
  );
}
Projectcard.Loading = Loading;
