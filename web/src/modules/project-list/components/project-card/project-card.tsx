import { ProjectIcon } from "@/components/project-icon/project-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { MessageSquare, ThumbsUp } from "lucide-react";
import type { Project } from "../../types/project";

type Props = Project & {
  rank?: number;
  onUpvote?: () => boolean | void;
  isUpvotePending?: boolean;
};

export function ProjectCard({
  id,
  slug,
  title,
  description,
  iconUrl,
  topis,
  upCount,
  hasUpvoted,
  commentCount,
  rank,
  onUpvote,
  isUpvotePending,
}: Props) {
  return (
    <article className="group flex items-start gap-3 rounded-lg border-b px-2 py-4 transition-colors hover:bg-muted/40 sm:gap-4">
      {rank !== undefined && (
        <span
          className="w-5 pt-3 text-right text-sm font-semibold tabular-nums text-muted-foreground"
          aria-label={`Posição ${rank}`}
        >
          {rank}
        </span>
      )}
      <ProjectIcon
        iconUrl={iconUrl}
        className="size-12 shrink-0 rounded-lg sm:size-14"
      />
      <div className="min-w-0 flex-1">
        <Link
          to="/projects/$slug"
          params={{ slug }}
          className="font-semibold leading-6 hover:text-primary hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-ring"
        >
          {title}
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {topis.map((topic) => (
            <Badge key={topic}>{topic}</Badge>
          ))}
          {commentCount > 0 && (
            <span className="ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="size-3.5" />
              {commentCount}
            </span>
          )}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-auto min-h-10 flex-col gap-0 px-2.5 text-xs sm:min-w-14"
        aria-label={`${hasUpvoted ? "Retirar voto de" : "Votar em"} ${title}: ${upCount} votos`}
        aria-pressed={hasUpvoted}
        disabled={isUpvotePending}
        onClick={() => onUpvote?.()}
      >
        <ThumbsUp className={hasUpvoted ? "fill-primary text-primary" : ""} />
        <span>{upCount}</span>
      </Button>
      <span className="sr-only">Projeto {id}</span>
    </article>
  );
}
