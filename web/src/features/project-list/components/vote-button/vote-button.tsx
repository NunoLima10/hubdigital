import { Button, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconConfetti } from "@tabler/icons-react";
import { useReward } from "react-rewards";
import { useVotes } from "../../hooks/use-votes";
import classes from "./vote-button.module.css";

type VoteButtonProps = {
  slug: string;
  upCount: number;
};

export function VoteButton({ slug, upCount }: VoteButtonProps) {
  const rewardId = "reward-" + slug;
  // Equivalent to $mantine-breakpoint-xs -> 36em
  const isRowButton = useMediaQuery("(min-width: 36em)");
  const { hasVoted, toggleVote } = useVotes();
  const voted = hasVoted(slug);

  const { reward, isAnimating } = useReward(rewardId, "confetti", {
    lifetime: 2000,
  });

  function onClick() {
    if (!voted) reward();
    toggleVote(slug);
  }

  return (
    <>
      {!isRowButton && <span id={rewardId} />}
      <Button
        variant={voted ? "light" : "default"}
        leftSection={isRowButton ? <span id={rewardId} /> : null}
        rightSection={<IconConfetti size={18} className={classes.icon} />}
        classNames={{
          inner: classes.inner,
          root: classes.root,
          section: classes.section,
          label: classes.label,
        }}
        onClick={onClick}
        disabled={isAnimating}
        aria-pressed={voted}
        aria-label={voted ? "Remover voto" : "Votar"}
      >
        <Text size="sm">{upCount + (voted ? 1 : 0)}</Text>
      </Button>
    </>
  );
}
