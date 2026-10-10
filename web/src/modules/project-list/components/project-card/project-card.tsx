import {
  ProjectSummary,
  ProjectVoteButton,
} from "@/components/project-summary/project-summary";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import {
  projectViewTransitionName,
  selectProjectViewTransition,
  useProjectViewTransition,
} from "@/lib/project-view-transition";
import { useState, type MouseEvent } from "react";
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
  transitionScope?: string;
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
  transitionScope = "projects",
}: Props) {
  const pathname = useLocation({ select: (location) => location.pathname });
  // Router updates the location before capturing the old route. Its source
  // identity must remain attached to the page this card was mounted on.
  const [sourcePathname] = useState(pathname);
  const selected = useProjectViewTransition();
  const source = `${sourcePathname}:${transitionScope}:${id}`;

  function select(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    selectProjectViewTransition({ projectId: id, source, slug, title, description, iconUrl, topics: topis });
    onSelect?.();
  }

  return (
    <article className="group relative rounded-lg px-2 py-3 sm:py-4">
      <ProjectSummary
        viewTransitionName={selected?.source === source ? projectViewTransitionName(id) : undefined}
        iconUrl={iconUrl}
        description={description}
        topics={topis}
        title={
          <Link
            to="/projects/$slug"
            viewTransition
            params={{ slug }}
            onClick={select}
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
