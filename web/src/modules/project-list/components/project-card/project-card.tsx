import {
  ProjectSummary,
  ProjectVoteButton,
} from "@/components/project-summary/project-summary";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Project } from "../../types/project";

type Props = Project & {
  rank?: number;
  onUpvote?: () => boolean | void;
  isUpvotePending?: boolean;
  onSelect?: () => void;
  favorited?: boolean;
  onFavorite?: () => void;
  isFavoritePending?: boolean;
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
  onSelect,
  favorited,
  onFavorite,
  isFavoritePending,
}: Props) {
  return (
    <article className="group relative rounded-lg px-2 py-3 sm:py-4">
      <ProjectSummary
        iconUrl={iconUrl}
        description={description}
        topics={topis}
        title={
          <Link
            to="/projects/$slug"
            params={{ slug }}
            onClick={onSelect}
            className="font-semibold leading-6 after:absolute after:inset-0 after:rounded-lg hover:text-primary hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-ring focus-visible:after:outline-2 focus-visible:after:outline-ring"
          >
            {rank !== undefined && `${rank}. `}
            {title}
          </Link>
        }
        actions={
          <>
            {onFavorite && (
              <Button
                variant="outline"
                size="sm"
                className="size-[52px] flex-col gap-0 p-0 text-xs"
                disabled={isFavoritePending}
                aria-label={favorited ? `Remover ${title} dos favoritos` : `Guardar ${title} nos favoritos`}
                onClick={onFavorite}
              >
                <Heart className={favorited ? "fill-current" : undefined} />
              </Button>
            )}
            <Link
              to="/projects/$slug"
              params={{ slug }}
              hash="comments-title"
              onClick={onSelect}
              aria-label={`Ver ${commentCount} comentários de ${title}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "hidden size-[52px] flex-col gap-0 p-0 text-xs sm:inline-flex",
              )}
            >
              <MessageSquare />
              <span>{commentCount}</span>
            </Link>
            <ProjectVoteButton
              title={title}
              count={upCount}
              active={hasUpvoted}
              disabled={isUpvotePending}
              onClick={() => onUpvote?.()}
            />
          </>
        }
      />
      <span className="sr-only">Projeto {id}</span>
    </article>
  );
}
