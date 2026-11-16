import { BadgeReveal } from "@/components/badge/badge-reveal";
import { BadgeMedal } from "@/components/badge/badge-medal";
import { badgeTints } from "@/components/badge/badge-tints";
import { DockReveal, DOCK_IMPACT_MS } from "@/components/badge/dock-reveal";
import { buttonVariants } from "@/components/ui/button";
import { useMarkBadgesSeen } from "@/modules/badges/hooks/use-my-badges";
import type { BadgeKey } from "@hubdigital/shared";
import { authClient } from "@/lib/auth-client";
import {
  getRevealVariant,
  type RevealVariant,
} from "@/components/badge/reveal-variants";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { Check, Compass, Plus, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

export type OnboardingResult = {
  profileResponse: string;
  objectiveResponse: string;
  membershipNumber?: number;
  /** Badges earned by joining (the founding-member ones). */
  badges?: BadgeKey[];
};

const messages: Record<string, string> = {
  student:
    "Aprende com quem já está a construir e mostra ao mundo o que andas a criar.",
  "technology-professional":
    "O teu talento faz falta. Mostra o que constróis e encontra com quem construir a seguir.",
  founder:
    "Todo o grande produto começou pequeno. Partilha o teu e encontra quem o apoie.",
  investor:
    "Os próximos grandes produtos de Cabo Verde estão aqui. Descobre-os primeiro.",
};

const BADGE_DELAY_MS = 550;

const COLORS = ["#2563eb", "#4d7fff", "#f6c445", "#e23d3d", "#ffffff"];

/**
 * The confetti for each reveal variant, timed to its animation. The badge
 * card's entry starts ~550ms in (see BADGE_DELAY_MS).
 */
function celebrate(reveal: RevealVariant, hasBadge: boolean) {
  if (prefersReducedMotion() || reveal === "calm") return [];
  const sides = () => {
    confetti({ particleCount: 70, angle: 60, spread: 65, startVelocity: 55, origin: { x: 0, y: 0.75 }, colors: COLORS });
    confetti({ particleCount: 70, angle: 120, spread: 65, startVelocity: 55, origin: { x: 1, y: 0.75 }, colors: COLORS });
  };
  if (reveal === "drop" && hasBadge) {
    // A burst out of the impact point, where the medal hits the card.
    return [
      window.setTimeout(
        () => confetti({ particleCount: 120, spread: 360, startVelocity: 28, gravity: 0.9, scalar: 0.9, origin: { y: 0.55 }, colors: COLORS }),
        BADGE_DELAY_MS + 470,
      ),
    ];
  }
  // The dock fires its own burst from the avatar's corner.
  if (reveal === "dock" && hasBadge) return [];
  sides();
  return [
    window.setTimeout(() => confetti({ particleCount: 90, spread: 100, origin: { y: 0.4 }, colors: COLORS }), 250),
  ];
}

export function OnboardingSuccess({
  result,
  ready,
  reveal: forcedReveal,
  preview = false,
}: {
  result: OnboardingResult;
  ready: boolean;
  /** Overrides the forced variant (?reveal= or the playground's pick). */
  reveal?: RevealVariant;
  /** Playground: don't mark the badge as seen. */
  preview?: boolean;
}) {
  const { data } = authClient.useSession();
  const user = data?.user;
  const firstName = user?.name?.split(" ")[0];
  const wantsToLaunch = result.objectiveResponse === "launch-product";
  // A dead photo URL would otherwise show the browser's broken-image icon.
  const [imageFailed, setImageFailed] = useState(false);

  const earnedBadge = result.badges?.[0];
  const { mutate: markSeen } = useMarkBadgesSeen();

  const [storedReveal] = useState(getRevealVariant);
  const reveal = forcedReveal ?? storedReveal;
  const replayConfetti = () => celebrate(reveal, false);

  useEffect(() => {
    const timers = celebrate(reveal, Boolean(earnedBadge));
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      confetti.reset();
    };
  }, [reveal, earnedBadge]);

  // Revealed here, so the site-wide celebration doesn't show it again.
  useEffect(() => {
    if (result.badges?.length && !preview) markSeen(result.badges);
  }, [result.badges, markSeen, preview]);

  // The session is refreshed in the background; until it carries onboardedAt,
  // the dashboard guard would bounce the user back here.
  const linkClass = (primary: boolean) =>
    cn(
      buttonVariants({ size: "lg", variant: primary ? "default" : "outline" }),
      "group w-full sm:w-auto",
      !ready && "pointer-events-none opacity-50",
    );
  const explore = (
    <Link to="/" aria-disabled={!ready} className={linkClass(!wantsToLaunch)}>
      <Compass />
      Explorar projetos
    </Link>
  );
  const publish = (
    <Link to="/dashboard/submit" aria-disabled={!ready} className={linkClass(wantsToLaunch)}>
      <Plus />
      Publicar o meu primeiro projeto
    </Link>
  );

  const avatar = (
  <span className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-muted text-3xl font-semibold text-muted-foreground ring-4 ring-primary-soft ring-offset-4 ring-offset-card">
    {user?.image && !imageFailed ? (
      <img
        src={user.image}
        alt=""
        className="size-full object-cover"
        onError={() => setImageFailed(true)}
      />
    ) : firstName ? (
      firstName[0].toUpperCase()
    ) : (
      <UserRound className="size-10" />
    )}
  </span>
  );

  // Variant C: the medal docks on the avatar, so the welcome text waits for
  // the avatar and the card below only names the achievement.
  const docked = reveal === "dock" && earnedBadge ? earnedBadge : null;
  const after = (ms: number) =>
    docked ? ({ animationDelay: `${ms}ms` } as const) : undefined;

  return (
    <div className="mx-auto w-full max-w-xl text-center">
      <div className="rounded-2xl border bg-card px-5 py-10 shadow-sm sm:px-10 sm:py-12">
        {docked ? (
          <DockReveal
            tint={badgeTints[docked]}
            piece={<BadgeMedal badgeKey={docked} compact className="size-full" />}
          >
            {avatar}
          </DockReveal>
        ) : (
          <button
            type="button"
            aria-label="Celebrar outra vez"
            onClick={replayConfetti}
            className="relative mx-auto block rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 animate-in zoom-in-50 fade-in-0 duration-500 ease-[cubic-bezier(0.3,1.5,0.5,1)]"
          >
            {avatar}
            <span className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border-4 border-card bg-primary text-primary-foreground animate-in zoom-in-0 duration-300 delay-300 [animation-fill-mode:backwards]">
              <Check className="size-4" strokeWidth={3} />
            </span>
          </button>
        )}

        <h1 className="mt-7 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-150 [animation-fill-mode:backwards]"
          style={after(1450)}
        >
          Bem-vindo{firstName ? `, ${firstName}` : ""}!
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-pretty text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-250 [animation-fill-mode:backwards]"
          style={after(1600)}
        >
          Já fazes parte da comunidade que está a pôr Cabo Verde no mapa digital.{" "}
          {messages[result.profileResponse]}
        </p>

        {docked ? (
          <div
            className="mx-auto mt-8 max-w-sm animate-in fade-in-0 zoom-in-95 duration-500 [animation-fill-mode:backwards]"
            style={after(DOCK_IMPACT_MS - 150)}
          >
            <BadgeReveal
              badgeKey={docked}
              membershipNumber={result.membershipNumber}
              delayMs={DOCK_IMPACT_MS - 150}
              variant="compact"
              reveal={reveal}
            />
          </div>
        ) : earnedBadge && (
          <div className="mx-auto mt-24 max-w-sm animate-in fade-in-0 zoom-in-95 duration-500 delay-300 [animation-fill-mode:backwards]">
            <BadgeReveal
              badgeKey={earnedBadge}
              membershipNumber={result.membershipNumber}
              delayMs={BADGE_DELAY_MS}
              variant="card"
              reveal={reveal}
            />
          </div>
        )}

        {/* The suggested action follows the objective picked in onboarding;
            it sits on the right on desktop and on top on a phone. */}
        <div className="mt-8 flex flex-col-reverse justify-center gap-2 sm:flex-row animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-400 [animation-fill-mode:backwards]"
          style={after(DOCK_IMPACT_MS + 900)}
        >
          {wantsToLaunch ? explore : publish}
          {wantsToLaunch ? publish : explore}
        </div>
      </div>
    </div>
  );
}
