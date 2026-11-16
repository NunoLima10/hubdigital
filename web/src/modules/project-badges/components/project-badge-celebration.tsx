import { authClient } from "@/lib/auth-client";
import { useMyBadges } from "@/modules/badges/hooks/use-my-badges";
import { useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useMarkProjectBadgesSeen,
  useUnseenProjectBadges,
} from "../hooks/use-unseen-project-badges";
import { ProjectBadgeCelebrationView } from "./project-badge-celebration-view";

/**
 * Celebrates achievements the signed-in maker's projects earned since they
 * last visited, one at a time, the next time they open the site. A personal
 * badge celebration goes first; onboarding and the playground are skipped.
 */
export function ProjectBadgeCelebration() {
  const { data: session } = authClient.useSession();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const onboarded = Boolean(
    session?.user && "onboardedAt" in session.user && session.user.onboardedAt,
  );
  const skipped = pathname.startsWith("/onboarding") || pathname.startsWith("/playground");
  const enabled = onboarded && !skipped;

  const { data: awards } = useUnseenProjectBadges(enabled);
  // Shares the personal celebration's query, so it costs no extra request.
  const { data: myBadges } = useMyBadges(enabled);
  const personalPending = myBadges?.some((badge) => badge.seenAt === null) ?? true;

  const markSeen = useMarkProjectBadgesSeen();
  const [dismissed, setDismissed] = useState<number[]>([]);

  const queue = useMemo(
    () => awards?.filter((award) => !dismissed.includes(award.id)) ?? [],
    [awards, dismissed],
  );
  const current = queue[0];

  if (!current || !enabled || personalPending) return null;

  function close() {
    if (!current) return;
    setDismissed((ids) => [...ids, current.id]);
    markSeen.mutate([current.id]);
  }

  return (
    <ProjectBadgeCelebrationView
      // A fresh mount per award replays the whole entry.
      key={current.id}
      award={current}
      open
      onClose={close}
      // Counted from what was queued this visit, so it holds as awards are marked.
      position={{ index: dismissed.length + 1, total: dismissed.length + queue.length }}
    />
  );
}
