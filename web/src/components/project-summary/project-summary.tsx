import { ProjectIcon } from "@/components/project-icon/project-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThumbsUp } from "lucide-react";
import type { ReactNode } from "react";

type ProjectSummaryProps = {
  iconUrl?: string | null;
  title: ReactNode;
  description: string;
  topics: string[];
  actions?: ReactNode;
  className?: string;
  actionsClassName?: string;
  iconClassName?: string;
  viewTransitionName?: string;
};

export function ProjectSummary({
  iconUrl,
  title,
  description,
  topics,
  actions,
  className,
  actionsClassName,
  iconClassName,
  viewTransitionName,
}: ProjectSummaryProps) {
  return (
    <div
      className={cn("flex items-center gap-3 sm:gap-4", className)}
      style={viewTransitionName ? { viewTransitionName } : undefined}
    >
      <ProjectIcon
        iconUrl={iconUrl ?? undefined}
        className={cn("size-12 shrink-0 rounded-lg sm:size-14", iconClassName)}
      />
      <div className="min-w-0 flex-1">
        {title}
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {description}
        </p>
        {topics.length > 0 && (
          <div className="mt-1.5 hidden flex-wrap items-center gap-1.5 sm:flex">
            {topics.map((topic) => (
              <Badge key={topic}>{topic}</Badge>
            ))}
          </div>
        )}
      </div>
      {actions && (
        <div
          className={cn(
            "relative z-10 flex shrink-0 items-center gap-4",
            actionsClassName,
          )}
        >
          {actions}
        </div>
      )}
    </div>
  );
}

type ProjectVoteButtonProps = {
  title: string;
  count: number;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export function ProjectVoteButton({
  title,
  count,
  active,
  disabled,
  onClick,
}: ProjectVoteButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="size-[52px] flex-col gap-0 p-0 text-xs"
      aria-label={`${active ? "Retirar voto de" : "Votar em"} ${title}: ${count} votos`}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      <ThumbsUp className={active ? "fill-primary text-primary" : ""} />
      <span>{count}</span>
    </Button>
  );
}
