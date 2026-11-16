import { BadgeReveal } from "@/components/badge/badge-reveal";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { badgeCatalog } from "@hubdigital/shared";
import { Link, useRouterState } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { useEffect, useMemo, useState } from "react";
import { useMarkBadgesSeen, useMyBadges } from "../hooks/use-my-badges";

const COLORS = ["#2563eb", "#4d7fff", "#f6c445", "#34c98f", "#ffffff"];

/**
 * Celebrates badges the user hasn't been shown yet — one granted by staff, or
 * one earned before badges existed — the next time they visit, one at a time.
 * The onboarding welcome screen reveals its own badge, so it is skipped there.
 */
export function BadgeCelebration() {
  const { data: session } = authClient.useSession();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const onboarded = Boolean(
    session?.user && "onboardedAt" in session.user && session.user.onboardedAt,
  );
  const onOnboarding = pathname.startsWith("/onboarding");

  const { data: badges } = useMyBadges(onboarded && !onOnboarding);
  const markSeen = useMarkBadgesSeen();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const next = useMemo(
    () =>
      badges?.find(
        (badge) => badge.seenAt === null && !dismissed.includes(badge.key),
      ),
    [badges, dismissed],
  );

  const open = Boolean(next) && !onOnboarding;

  useEffect(() => {
    if (!open || prefersReducedMotion()) return;
    const timer = window.setTimeout(
      () =>
        confetti({
          particleCount: 90,
          spread: 90,
          origin: { y: 0.45 },
          colors: COLORS,
          zIndex: 1300,
        }),
      1100,
    );
    return () => window.clearTimeout(timer);
  }, [open, next?.key]);

  if (!next) return null;

  function close() {
    if (!next) return;
    setDismissed((keys) => [...keys, next.key]);
    markSeen.mutate([next.key]);
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={`Ganhaste a conquista ${badgeCatalog[next.key].name}`}
      hideHeader
      className="md:max-w-sm"
    >
      <div className="pt-4">
        <BadgeReveal badgeKey={next.key} delayMs={250} />
        <div className="mt-6 flex flex-col gap-2">
          <Button type="button" onClick={close}>
            Continuar
          </Button>
          <Link
            to="/dashboard/profile"
            hash="badges"
            onClick={close}
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            Escolher o distintivo do perfil
          </Link>
        </div>
      </div>
    </Dialog>
  );
}
