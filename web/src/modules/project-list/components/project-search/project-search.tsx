import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { ListPeriod } from "@hubdigital/shared";
import { useRef, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ProjectList } from "../..";
import { projectPeriodOptions } from "../../options";
import {
  ProjectFilters,
  type ProjectFilterValues,
} from "../project-filters/project-filters";

export function ProjectSearch({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const search = useSearch({ strict: false });
  const navigate = useNavigate();
  const filters: ProjectFilterValues = {
    q: search.q,
    island: search.island,
    categoryId: search.categoryId,
    pricing: search.pricing,
    availability: search.availability,
    projectStage: search.projectStage,
    helpWanted: search.helpWanted,
  };
  const period: ListPeriod = search.period ?? "all";
  const setFilters = (next: ProjectFilterValues) =>
    void navigate({
      to: ".",
      search: (previous) => ({ ...previous, ...next }),
      replace: true,
    });
  const setPeriod = (next: ListPeriod) =>
    void navigate({
      to: ".",
      search: (previous) => ({
        ...previous,
        period: next === "all" ? undefined : next,
      }),
      replace: true,
    });
  const [resetKey, setResetKey] = useState(0);
  const hasFilters = Boolean(
    Object.values(filters).some(Boolean) || period !== "all",
  );
  const activeFilterCount =
    Object.values(filters).filter(Boolean).length + Number(period !== "all");

  return (
    <Dialog
      open
      onClose={onClose}
      dialogRef={dialogRef}
      title="Procurar projetos"
      className="max-h-[min(90dvh,48rem)] max-w-3xl"
      bodyClassName="min-h-0 flex-1 overflow-y-auto p-0"
    >
      <div className="top-0 z-10 space-y-3 border-b bg-card p-4 sm:p-5 [@media(min-height:600px)]:sticky">
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
              {projectPeriodOptions.map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={`inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${period === value ? "border-primary/40 bg-primary-soft text-primary" : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"}`}
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
                void navigate({
                  to: ".",
                  search: (previous) => ({
                    ...previous,
                    q: undefined,
                    island: undefined,
                    categoryId: undefined,
                    pricing: undefined,
                    availability: undefined,
                    projectStage: undefined,
                    helpWanted: undefined,
                    period: undefined,
                  }),
                  replace: true,
                });
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
          {activeFilterCount
            ? ` · ${activeFilterCount} ${activeFilterCount === 1 ? "filtro ativo" : "filtros ativos"}`
            : ""}
        </h3>
        <ProjectList
          period={period}
          filters={filters}
          onSelect={onClose}
          transitionScope="search"
        />
      </div>
    </Dialog>
  );
}
