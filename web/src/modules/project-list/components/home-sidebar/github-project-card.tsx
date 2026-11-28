import { Github } from "lucide-react";
import { GithubStarButton, githubFocusRing } from "@/components/github-star-button/github-star-button";
import { BadgeMedal } from "@/components/badge/badge-medal";
import { PROJECT_REPOSITORY } from "@/modules/project-list/hooks/use-github-stars";

const focusRing = githubFocusRing;

export function GithubProjectCard() {
  return (
    <section
      aria-labelledby="github-project-title"
      className="overflow-hidden rounded-xl border border-[#0E8A5F]/20 bg-[#F0FBF5] text-[#06452F] dark:border-[#7CF0C0]/20 dark:bg-[#0B281E] dark:text-[#E6FFF4]"
    >
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <a
            href={PROJECT_REPOSITORY}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex min-w-0 items-center gap-2 rounded-full border border-[#0E8A5F]/20 px-3 py-1.5 text-xs font-medium hover:bg-[#0E8A5F]/10 ${focusRing}`}
          >
            <Github className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">NunoLima10 / hubdigital</span>
          </a>
          <div className="badge-hover -mr-1 shrink-0">
            <BadgeMedal badgeKey="maintainer" compact className="size-12" />
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 id="github-project-title" className="text-lg font-semibold leading-snug tracking-tight">
              Este Hub também é teu.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#37634F] dark:text-[#B4D8C6]">
              Feito pela comunidade, para a comunidade. Contribui com código,
              ideias ou sugestões.
            </p>
          </div>
        </div>

        <GithubStarButton className="mt-4" />
      </div>

    </section>
  );
}
