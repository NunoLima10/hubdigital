import { Github, Star } from "lucide-react";
import { BadgeMedal } from "@/components/badge/badge-medal";
import {
  PROJECT_REPOSITORY,
  useGithubStars,
} from "@/modules/project-list/hooks/use-github-stars";

const formatStars = new Intl.NumberFormat("pt-PT");
const focusRing = "outline-none focus-visible:ring-2 focus-visible:ring-[#0E8A5F] focus-visible:ring-offset-2";

export function GithubProjectCard() {
  const { data: stars, isPending } = useGithubStars();

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

        <a
          href={PROJECT_REPOSITORY}
          target="_blank"
          rel="noopener noreferrer"
          className={`group mt-4 flex min-h-9 items-center justify-center gap-2 rounded-md bg-[#0A6C4A] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#08563B] motion-reduce:transition-none ${focusRing}`}
        >
          <Star
            className="size-4 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:-rotate-12 motion-safe:group-hover:scale-110"
            aria-hidden="true"
          />
          {stars !== undefined ? (
            <span className="text-xs tabular-nums" aria-label={`${formatStars.format(stars)} estrelas no GitHub`}>
              {formatStars.format(stars)}
            </span>
          ) : isPending ? (
            <span className="h-4 w-6 rounded bg-white/20 motion-safe:animate-pulse" aria-label="A carregar estrelas" />
          ) : null}
          <span className="ml-1 border-l border-white/30 pl-3">Dar uma estrela</span>
        </a>
      </div>

    </section>
  );
}
