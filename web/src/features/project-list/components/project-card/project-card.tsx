import { Anchor, Badge, Button, Flex, Group, Stack, Text } from "@mantine/core";
import { IconConfetti } from "@tabler/icons-react";
import classes from "./project-card.module.css";

import { useMediaQuery } from "@mantine/hooks";
import { useReward } from "react-rewards";
import { Project } from "../../types/project";

export function Projectcard({
  id,
  title,
  description,
  iconUrl,
  topis,
  upCount,
  website,
}: Project) {
  // Equivalent to $mantine-breakpoint-xs -> 36em
  const isRowButton = useMediaQuery("(min-width: 36em)");
  const rewardId = "rewardId" + id.toString();

  const { reward, isAnimating } = useReward(rewardId, "confetti", {
    lifetime: 2000,
  });
  return (
    <Flex className={classes.card}>
      <Flex gap={"xs"}>
        <img src={iconUrl} className={classes.icon}></img>
        <Stack gap={0}>
          <Anchor className={classes.titleLink} href={website} target="_blank">
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
        variant="default"
        className={classes.upvotetest}
        leftSection={isRowButton ? <span id={rewardId} /> : null}
        rightSection={<IconConfetti size={18} className={classes.upvoteIcon} />}
        classNames={{
          inner: classes.inner,
          root: classes.root,
          section: classes.section,
          label: classes.label,
        }}
        onClick={reward}
        disabled={isAnimating}
      >
        <Text size="sm">{upCount}</Text>
      </Button>
    </Flex>
  );
}
