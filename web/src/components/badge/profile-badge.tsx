import { cn } from "@/lib/utils";
import { badgeCatalog, type BadgeKey } from "@hubdigital/shared";
import { badgeLabel } from "./badge-label";
import { BadgeMedal } from "./badge-medal";

/**
 * A featured badge at avatar or inline size, with a tooltip naming it. It is
 * focusable so keyboard and touch users can read the tooltip too.
 */
export function ProfileBadge({
  badgeKey,
  membershipNumber,
  className,
  tooltip = true,
}: {
  badgeKey: BadgeKey;
  membershipNumber?: number;
  className?: string;
  tooltip?: boolean;
}) {
  const badge = badgeCatalog[badgeKey];
  const label = badgeLabel(badgeKey, membershipNumber);

  return (
    <span
      role="img"
      aria-label={label}
      tabIndex={tooltip ? 0 : undefined}
      className={cn(
        "badge-hover group relative inline-flex size-11 shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <BadgeMedal badgeKey={badgeKey} compact className="size-full" />
      {/* Out of the layout until shown, so it never widens the page. */}
      {tooltip && (
        <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 hidden w-max max-w-52 -translate-x-1/2 rounded-md bg-foreground px-2.5 py-1.5 text-center text-xs font-medium text-background shadow-lg animate-in fade-in-0 slide-in-from-bottom-1 duration-150 group-hover:block group-focus-visible:block">
          {badge.name}
          {membershipNumber && badgeKey.startsWith("founding-")
            ? ` · Membro #${membershipNumber}`
            : ""}
          <span className="block font-normal opacity-75">{badge.material}</span>
        </span>
      )}
    </span>
  );
}
