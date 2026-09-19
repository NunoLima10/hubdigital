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
import { IconConfetti, IconMessageCircle } from "@tabler/icons-react";
import classes from "./project-card.module.css";

import { useMediaQuery } from "@mantine/hooks";
import { useReward } from "react-rewards";
import { Project } from "../../types/project";

type ProjectcardProps = Project & {
  /** Position in the current weekly ranking, 1-based. */
  rank?: number;
  onOpen?: () => void;
  /** Return false to signal the vote was not cast (e.g. sign-in required). */
  onUpvote?: () => boolean | void;
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
  commentCount,
  website,
  rank,
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
    // Celebrate only when a vote actually lands — a logged-out click opens the
    // sign-in prompt instead, and confetti there is a lie.
    const cast = onUpvote?.();
    if (cast !== false && !hasUpvoted) reward();
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
        {rank !== undefined && (
          <Text
            className={rank <= 3 ? classes.rankTop : classes.rank}
            aria-label={`Posição ${rank}`}
          >
            {rank}
          </Text>
        )}
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
            {commentCount > 0 && (
              <Group gap={3} c="dimmed">
                <IconMessageCircle size={14} />
                <Text fz="xs">{commentCount}</Text>
              </Group>
            )}
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
