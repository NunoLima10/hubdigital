import { BadgeMedal } from "@/components/badge/badge-medal";
import { badgeLabel } from "@/components/badge/badge-label";
import { cn } from "@/lib/utils";
import { badgeCatalog, type AwardedBadge } from "@hubdigital/shared";
import type { CSSProperties } from "react";

const awardedOn = new Intl.DateTimeFormat("pt-PT", {
  month: "long",
  year: "numeric",
});

/** The "Conquistas" section of a public profile: every badge the maker holds. */
export function ProfileAchievements({
  badges,
  membershipNumber,
  className,
  sidebar = false,
}: {
  badges: AwardedBadge[];
  membershipNumber: number;
  className?: string;
  sidebar?: boolean;
}) {
  return (
    <section
      aria-labelledby="achievements-title"
      className={cn("border-t pt-6", className)}
    >
      <h2 id="achievements-title" className="mb-3 text-lg font-semibold">
        Conquistas
      </h2>
      <ul
        className={cn(
          "grid grid-cols-2 gap-3 sm:grid-cols-3",
          sidebar ? "lg:grid-cols-1" : "lg:grid-cols-5",
        )}
      >
        {badges.map((awarded, index) => {
          const badge = badgeCatalog[awarded.key];
          const isFounding = awarded.key.startsWith("founding-");
          return (
            <li
              key={awarded.key}
              tabIndex={0}
              aria-label={badgeLabel(awarded.key, membershipNumber)}
              className={cn(
                "badge-hover badge-intro flex flex-col items-center rounded-xl border bg-card p-4 text-center outline-none [perspective:700px] focus-visible:ring-2 focus-visible:ring-ring",
                sidebar && "lg:flex-row lg:gap-3 lg:p-3 lg:text-left",
              )}
              style={{ "--badge-intro-delay": `${index * 140}ms` } as CSSProperties}
            >
              <BadgeMedal
                badgeKey={awarded.key}
                className={cn("size-20", sidebar && "lg:size-16 lg:shrink-0")}
              />
              <div className={cn(sidebar && "lg:min-w-0")}>
                <p className={cn("mt-3 text-sm font-semibold", sidebar && "lg:mt-0")}>
                  {badge.name}
                </p>
                <p className="text-xs font-medium text-primary">
                  {isFounding ? `Membro #${membershipNumber}` : badge.material}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Desde {awardedOn.format(new Date(awarded.awardedAt))}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
