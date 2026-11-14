import { BadgeMedal } from "@/components/badge/badge-medal";
import { badgeLabel } from "@/components/badge/badge-label";
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
}: {
  badges: AwardedBadge[];
  membershipNumber: number;
}) {
  return (
    <section aria-labelledby="achievements-title" className="border-t pt-6">
      <h2 id="achievements-title" className="mb-3 text-lg font-semibold">
        Conquistas
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {badges.map((awarded, index) => {
          const badge = badgeCatalog[awarded.key];
          const isFounding = awarded.key.startsWith("founding-");
          return (
            <li
              key={awarded.key}
              tabIndex={0}
              aria-label={badgeLabel(awarded.key, membershipNumber)}
              className="badge-hover badge-intro flex flex-col items-center rounded-xl border bg-card p-4 text-center outline-none [perspective:700px] focus-visible:ring-2 focus-visible:ring-ring"
              style={{ "--badge-intro-delay": `${index * 140}ms` } as CSSProperties}
            >
              <BadgeMedal badgeKey={awarded.key} className="size-20" />
              <p className="mt-3 text-sm font-semibold">{badge.name}</p>
              <p className="text-xs font-medium text-primary">
                {isFounding ? `Membro #${membershipNumber}` : badge.material}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Desde {awardedOn.format(new Date(awarded.awardedAt))}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
