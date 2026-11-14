import { cn } from "@/lib/utils";
import { badgeCatalog, type BadgeKey } from "@hubdigital/shared";
import { useState } from "react";
import { BadgeMedal } from "./badge-medal";

/**
 * The "you earned a badge" moment: the full medal plays its entry, with the
 * badge named underneath. Clicking the medal plays it again.
 */
export function BadgeReveal({
  badgeKey,
  membershipNumber,
  className,
  delayMs = 0,
}: {
  badgeKey: BadgeKey;
  membershipNumber?: number;
  className?: string;
  /** Holds the entry back, e.g. until a surrounding card has appeared. */
  delayMs?: number;
}) {
  const badge = badgeCatalog[badgeKey];
  const [run, setRun] = useState(0);
  const isFounding = badgeKey.startsWith("founding-");

  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <button
        type="button"
        aria-label={`Ver outra vez o distintivo ${badge.name}`}
        onClick={() => setRun((value) => value + 1)}
        // Replaying is a flourish, not a step: keep it out of the tab order so
        // a dialog's initial focus lands on its real action.
        tabIndex={-1}
        className="badge-hover rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [perspective:700px]"
      >
        <span
          key={run}
          className="badge-intro block size-36 sm:size-40"
          style={{ "--badge-intro-delay": `${run ? 0 : delayMs}ms` } as React.CSSProperties}
        >
          <BadgeMedal badgeKey={badgeKey} className="size-full" />
        </span>
      </button>
      <p className="mt-4 text-xs font-semibold tracking-wide text-primary uppercase">
        Novo distintivo
      </p>
      <p className="mt-1 text-lg font-semibold">
        {badge.name} · {badge.material}
      </p>
      <p className="mt-1 max-w-xs text-sm text-pretty text-muted-foreground">
        {isFounding && membershipNumber
          ? `És o membro #${membershipNumber}. ${badge.description}`
          : badge.description}
      </p>
    </div>
  );
}
