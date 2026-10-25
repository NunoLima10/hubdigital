import { useId } from "react";
import { cn } from "@/lib/utils";
import { getSubmissionQuality } from "../../utils/quality-score";

type SubmissionQuality = ReturnType<typeof getSubmissionQuality>;

export function submissionQualityScoreColor(score: number) {
  if (score === 0) return "text-foreground";
  if (score < 4) return "text-destructive";
  if (score < 8) return "text-orange-600 dark:text-orange-400";
  if (score < 10) return "text-teal-600 dark:text-teal-400";
  return "text-emerald-700 dark:text-emerald-400";
}

export function SubmissionQualityScore({
  quality,
  compact = false,
}: {
  quality: SubmissionQuality;
  compact?: boolean;
}) {
  const tooltipId = useId();
  const hint = quality.nextImprovement;

  return (
    <div
      tabIndex={0}
      aria-label={`Qualidade da submissão: ${quality.score} em 10, ${quality.label}`}
      aria-describedby={tooltipId}
      className="group relative inline-flex cursor-help flex-col items-end rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      <p
        className={cn(
          "font-semibold tracking-tight tabular-nums",
          compact ? "text-xl" : "text-2xl",
          submissionQualityScoreColor(quality.score),
        )}
      >
        {quality.score}
        <span className="text-xs font-normal text-muted-foreground">/10</span>
      </p>
      <p className="text-xs text-muted-foreground">{compact ? "Qualidade" : quality.label}</p>
      <div
        id={tooltipId}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute right-0 top-full z-30 mt-2 w-64 translate-y-1 rounded-md border bg-popover p-3 text-left text-popover-foreground shadow-md opacity-0",
          "transition-[opacity,transform] duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
        )}
      >
        <p className="text-xs font-semibold">{quality.label}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {hint ? hint.description : "A submissão inclui todos os elementos essenciais e recomendados."}
        </p>
        {hint && (
          <p className="mt-2 text-xs font-medium">
            Próximo passo: {hint.label}
          </p>
        )}
      </div>
    </div>
  );
}
