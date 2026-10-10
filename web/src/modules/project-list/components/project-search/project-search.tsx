import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { ListPeriod } from "@hubdigital/shared";
import { useRef, useState } from "react";
import { ProjectList } from "../..";
import {
  ProjectFilters,
  type ProjectFilterValues,
} from "../project-filters/project-filters";

export function ProjectSearch({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<ProjectFilterValues>({});
  const [period, setPeriod] = useState<ListPeriod>("all");
  const [resetKey, setResetKey] = useState(0);
  const hasFilters = Boolean(
    filters.q ||
    filters.island ||
    filters.categoryId ||
    filters.pricing ||
    period !== "all",
  );

  return (
    <Dialog
      open
      onClose={onClose}
      dialogRef={dialogRef}
      title="Procurar projetos"
      className="max-h-[min(90dvh,48rem)] max-w-3xl"
      bodyClassName="min-h-0 flex-1 overflow-y-auto p-0"
    >
      <div className="sticky top-0 z-10 space-y-3 border-b bg-card p-4 sm:p-5">
        <ProjectFilters
          key={resetKey}
          value={filters}
          onChange={setFilters}
          autoFocusSearch
          portalContainer={dialogRef}
        />
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div role="group" aria-label="Período" className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Período
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["all", "Todos"],
                  ["this_week", "Esta semana"],
                  ["last_week", "Semana passada"],
                ] as const
              ).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={`inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${period === value ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  aria-pressed={period === value}
                  onClick={() => setPeriod(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilters({});
                setPeriod("all");
                setResetKey((key) => key + 1);
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
          Resultados
        </h3>
        <ProjectList period={period} filters={filters} onSelect={onClose} transitionScope="search" />
      </div>
    </Dialog>
  );
}
