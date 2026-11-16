import { cn } from "@/lib/utils";
import { badgeCatalog, type BadgeKey } from "@hubdigital/shared";
import { useState, type CSSProperties } from "react";
import { BadgeMedal } from "./badge-medal";
import { badgeTints } from "./badge-tints";
import type { RevealVariant } from "./reveal-variants";

/** Text start times, counted from the medal's entry; it lands at ~950ms. */
const TEXT_DELAYS = { eyebrow: 750, name: 880, description: 1010 };

/**
 * The "you earned a badge" moment: the full medal plays its entry, then the
 * badge is named underneath, one line after another. Clicking the medal plays
 * it again.
 *
 * `card` sets it in a panel tinted with the badge's colour, with the medal
 * sitting on its top edge; the parent leaves room above for it (`mt-20`).
 */
export function BadgeReveal({
  badgeKey,
  membershipNumber,
  className,
  delayMs = 0,
  variant = "plain",
  reveal = "sequence",
}: {
  badgeKey: BadgeKey;
  membershipNumber?: number;
  className?: string;
  /** Holds the entry back, e.g. until a surrounding card has appeared. */
  delayMs?: number;
  /** `compact`: a small card, the medal on the left and the text beside it. */
  variant?: "plain" | "card" | "compact";
  /** Which entry animation plays (see reveal-variants.ts and index.css). */
  reveal?: RevealVariant;
}) {
  const badge = badgeCatalog[badgeKey];
  const [run, setRun] = useState(0);
  const isFounding = badgeKey.startsWith("founding-");
  const isCard = variant === "card";
  const isCompact = variant === "compact";

  const textDelay = (ms: number) => ({ "--badge-delay": `${ms}ms` }) as CSSProperties;

  const medal = (
    <button
      type="button"
      aria-label={`Ver outra vez a conquista ${badge.name}`}
      onClick={() => setRun((value) => value + 1)}
      // Replaying is a flourish, not a step: keep it out of the tab order so
      // a dialog's initial focus lands on its real action.
      tabIndex={-1}
      className={cn(
        "badge-hover rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [perspective:700px]",
        isCard && "absolute -top-18 left-1/2 -translate-x-1/2 sm:-top-20",
        isCompact && "shrink-0",
      )}
    >
      <span
        key={run}
        className={cn("badge-intro relative block", isCompact ? "size-20" : "size-36 sm:size-40")}
        style={{ "--badge-intro-delay": `${run ? 0 : delayMs}ms` } as CSSProperties}
      >
        <span aria-hidden="true" className="badge-reveal__glow" />
        <span aria-hidden="true" className="badge-reveal__ring" />
        <BadgeMedal badgeKey={badgeKey} className="relative size-full" />
      </span>
    </button>
  );

  const text = (
    <>
      <p
        className={cn(
          "badge-reveal__text badge-reveal__eyebrow text-xs font-semibold tracking-wide uppercase",
          !isCompact && "mt-4",
        )}
        style={textDelay(TEXT_DELAYS.eyebrow)}
      >
        Nova conquista
      </p>
      <p
        className={cn("badge-reveal__text mt-1 font-semibold", isCompact ? "text-base" : "text-lg")}
        style={textDelay(TEXT_DELAYS.name)}
      >
        {badge.name} · {badge.material}
      </p>
      <p
        className="badge-reveal__text mt-1 max-w-xs text-sm text-pretty text-muted-foreground"
        style={textDelay(TEXT_DELAYS.description)}
      >
        {isFounding && membershipNumber
          ? `És o membro #${membershipNumber}. ${badge.description}`
          : badge.description}
      </p>
    </>
  );

  return (
    <div
      data-reveal={reveal}
      className={cn(
        isCompact
          ? "badge-reveal-card flex items-center gap-4 rounded-xl border px-4 py-4 text-left"
          : "flex flex-col items-center text-center",
        isCard && "badge-reveal-card relative rounded-2xl border px-5 pt-22 pb-6 sm:pt-24",
        className,
      )}
      style={
        {
          "--badge-tint": badgeTints[badgeKey],
          "--badge-intro-delay": `${delayMs}ms`,
        } as CSSProperties
      }
    >
      {medal}
      {isCompact ? <div className="min-w-0">{text}</div> : text}
    </div>
  );
}
