import {
  ProjectPlaque,
  plaquePeriodLabel,
} from "@/components/project-badge/project-plaque";
import type { Project } from "@/modules/submit/types/project";
import {
  projectBadgeCatalog,
  type ProjectBadgeAward,
  type ProjectBadgeKey,
} from "@hubdigital/shared";
import { useId, type CSSProperties } from "react";

type Group = {
  key: ProjectBadgeKey;
  /** The most recent award of this badge; repeats stack behind it. */
  latest: ProjectBadgeAward;
  times: number;
  periods: string[];
};

/** One tile per badge, newest period on top, in catalog order (the API's). */
function groupAwards(awards: ProjectBadgeAward[]): Group[] {
  const groups = new Map<ProjectBadgeKey, Group>();
  for (const award of awards) {
    const group = groups.get(award.key);
    if (group) {
      group.times += 1;
      if (award.period) group.periods.push(award.period);
    } else {
      groups.set(award.key, {
        key: award.key,
        latest: award,
        times: 1,
        periods: award.period ? [award.period] : [],
      });
    }
  }
  return [...groups.values()];
}

function weekLabel(weekId: string) {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekId);
  return match ? `Semana ${Number(match[2])} de ${match[1]}` : weekId;
}

function tooltip(group: Group) {
  const badge = projectBadgeCatalog[group.key];
  const periods = group.periods
    .map((period) => plaquePeriodLabel(period)?.toLowerCase())
    .filter(Boolean)
    .join(", ");
  return periods ? `${badge.description} (${periods})` : badge.description;
}

/**
 * The project's achievements, on its own page only: never next to the maker.
 * The best closing place leads, then one plaque per badge with repeats
 * stacked behind it.
 */
export function ProjectAchievements({ project }: { project: Project }) {
  // The sidebar renders twice (mobile and desktop), so the heading id can't be fixed.
  const titleId = useId();
  const groups = groupAwards(project.badges ?? []);
  const best = project.bestWeeklyRank;
  const showBest = best && best.rank <= 10;
  if (groups.length === 0 && !showBest) return null;

  return (
    <section aria-labelledby={titleId}>
      <h2
        id={titleId}
        className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        Conquistas
      </h2>

      {showBest && (
        <div className="mb-5 flex items-center gap-3 rounded-lg bg-primary-soft p-3">
          <span className="text-3xl leading-none font-semibold text-primary tabular-nums">
            {best.rank}º
          </span>
          <p className="text-xs text-muted-foreground">
            <b className="block text-sm font-semibold text-foreground">
              Melhor posição semanal
            </b>
            {weekLabel(best.week)}
            {best.times > 1 && ` · ${best.times} vezes em ${best.rank}º`}
          </p>
        </div>
      )}

      {groups.length > 0 && (
        <ul className="plaque-intro grid grid-cols-3 justify-items-center gap-x-3 gap-y-5">
          {groups.map((group, index) => {
            const badge = projectBadgeCatalog[group.key];
            const { latest } = group;
            return (
              <li
                key={group.key}
                className="grid justify-items-center gap-1.5 text-center"
                title={tooltip(group)}
                style={{ "--plaque-intro-delay": `${index * 90}ms` } as CSSProperties}
              >
                <span className="relative">
                  {group.times > 1 && (
                    <>
                      <span
                        aria-hidden="true"
                        className="absolute inset-[6%] translate-x-2 -translate-y-2 rotate-6 rounded-[22%] bg-foreground/15"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute inset-[6%] translate-x-3.5 -translate-y-3.5 rotate-12 rounded-[22%] bg-foreground/8"
                      />
                    </>
                  )}
                  <ProjectPlaque
                    kind={group.key}
                    period={latest.period}
                    rank={latest.rank ?? undefined}
                    number={group.key === "pioneer" ? (latest.rank ?? undefined) : undefined}
                    className="relative size-[4.5rem]"
                  />
                  {group.times > 1 && (
                    <span className="absolute -top-3 -right-3 rounded-full bg-foreground px-1.5 py-0.5 text-[11px] font-semibold text-background tabular-nums">
                      ×{group.times}
                    </span>
                  )}
                </span>
                <span className="text-[11px] leading-tight text-muted-foreground">
                  {badge.name}
                  {group.times > 1 && <span className="sr-only">, {group.times} vezes</span>}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
