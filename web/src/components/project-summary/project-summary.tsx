import { ProjectIcon } from "@/components/project-icon/project-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RollingNumber } from "@/components/rolling-number/rolling-number";
import { SparkBurst, type SparkBurstHandle } from "@/components/spark-burst/spark-burst";
import { useToggleAnimation } from "@/hooks/use-toggle-animation";
import { PRESS_KEYFRAMES, replay } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ArrowBigUp } from "lucide-react";
import { useRef, type ReactNode } from "react";

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
  const iconRef = useRef<SVGSVGElement>(null);
  const sparks = useRef<SparkBurstHandle>(null);
  const arm = useToggleAnimation(active, {
    onActivate() {
      replay(
        iconRef.current,
        [
          { transform: "translateY(0) scale(1)", easing: "ease-in-out" },
          { transform: "translateY(-9px) scale(1.1)", offset: 0.36, easing: "cubic-bezier(0.3, 1.6, 0.5, 1)" },
          { transform: "translateY(0) scale(1)" },
        ],
        { duration: 500 },
      );
      sparks.current?.burst();
    },
    onDeactivate() {
      replay(iconRef.current, PRESS_KEYFRAMES, { duration: 200, easing: "ease-out" });
    },
  });

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "relative size-[52px] flex-col gap-0 overflow-visible p-0 text-xs disabled:opacity-100 [&_svg]:size-5",
        active && "border-primary text-primary hover:text-primary",
      )}
      aria-label={`${active ? "Retirar voto de" : "Votar em"} ${title}: ${count} votos`}
      aria-pressed={active}
      disabled={disabled}
      onClick={() => {
        arm();
        onClick();
      }}
    >
      {/* Drawn larger than the sibling 16px icons, with the stroke scaled down
          (2 × 16/20) so the outline matches theirs pixel for pixel. */}
      <ArrowBigUp
        ref={iconRef}
        aria-hidden="true"
        strokeWidth={1.6}
        className={active ? "fill-current" : undefined}
      />
      <SparkBurst ref={sparks} delay={150} className="top-[40%]" />
      <RollingNumber value={count} className="h-4 leading-4" />
    </Button>
  );
}
