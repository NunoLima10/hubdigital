import { cn } from "@/lib/utils";
import {
  PROJECT_REPOSITORY,
  useGithubStars,
} from "@/modules/project-list/hooks/use-github-stars";
import { Star } from "lucide-react";

const formatStars = new Intl.NumberFormat("pt-PT");

export const githubFocusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#0E8A5F] focus-visible:ring-offset-2";

/** The green "star the repository" button with the live star count. */
export function GithubStarButton({
  label = "Dar uma estrela",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const { data: stars, isPending } = useGithubStars();

  return (
    <a
      href={PROJECT_REPOSITORY}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex min-h-9 items-center justify-center gap-2 rounded-md bg-[#0A6C4A] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#08563B] motion-reduce:transition-none",
        githubFocusRing,
        className,
      )}
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
      <span className="ml-1 border-l border-white/30 pl-3">{label}</span>
    </a>
  );
}
