import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { type Delta, formatCount } from "../../utils/format";

export function StatCard({
  label,
  icon,
  value,
  delta,
}: {
  label: string;
  icon: ReactNode;
  value: number;
  delta: Delta;
}) {
  return (
    <div className="space-y-2 rounded-lg border bg-card p-4">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="text-2xl font-bold tabular-nums">{formatCount(value)}</p>
      {delta.kind === "none" ? (
        <p className="text-xs text-muted-foreground">Sem dados anteriores</p>
      ) : delta.kind === "new" ? (
        <span className="inline-flex rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          Novo
        </span>
      ) : (
        <span
          className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-xs font-medium ${delta.percent >= 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}
        >
          {delta.percent >= 0 ? (
            <ArrowUpRight className="size-3" />
          ) : (
            <ArrowDownRight className="size-3" />
          )}
          {delta.percent >= 0 ? "+" : ""}
          {delta.percent}%
        </span>
      )}
    </div>
  );
}
