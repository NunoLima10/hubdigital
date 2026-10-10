import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StatsRange } from "@hubdigital/shared";
import { BarChart3, Eye, ExternalLink, Heart, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useMyProjectStats } from "../../hooks/use-my-project-stats";
import { useProjectStats } from "../../hooks/use-project-stats";
import { computeDelta } from "../../utils/format";
import { StatCard } from "../stat-card/stat-card";
import { TrafficChart } from "../traffic-chart/traffic-chart";

const ranges: { value: StatsRange; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
];
export function MetricsView() {
  const [range, setRange] = useState<StatsRange>("30d");
  const [projectFilter, setProjectFilter] = useState("all");
  const { data, isLoading, isError } = useMyProjectStats(range);
  const selectedProjectId =
    projectFilter === "all" ? undefined : Number(projectFilter);
  const {
    data: selectedProjectStats,
    isLoading: isProjectLoading,
    isError: isProjectError,
  } = useProjectStats(selectedProjectId, range);
  const stats = selectedProjectId === undefined ? data : selectedProjectStats;
  const showLoading = useDelayedLoading(
    isLoading || (selectedProjectId !== undefined && isProjectLoading),
  );
  const hasError = isError || isProjectError;
  const projectOptions = [
    { value: "all", label: "Todos os projetos" },
    ...(data?.projects.map((project) => ({
      value: String(project.id),
      label: project.name,
    })) ?? []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="hidden text-xl font-semibold lg:block">Desempenho</h1>
        <div
          role="group"
          aria-label="Período"
          className="flex rounded-md border p-1"
        >
          {ranges.map(({ value, label }) => (
            <button
              key={value}
              aria-pressed={range === value}
              className={`rounded px-3 py-1.5 text-sm ${range === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              onClick={() => setRange(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {data && data.projects.length > 0 && (
        <div className="flex flex-col gap-2 sm:max-w-xs">
          <label className="text-sm font-medium" htmlFor="project-metrics-filter">
            Projeto
          </label>
          <Select
            items={projectOptions}
            value={projectFilter}
            onValueChange={(value) => setProjectFilter(value ?? "all")}
          >
            <SelectTrigger
              id="project-metrics-filter"
              className="w-full rounded-lg bg-card"
            >
              <BarChart3 className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              align="start"
              alignItemWithTrigger={false}
              className="rounded-lg p-1 ring-1 ring-border"
            >
              {projectOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="rounded-md"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground sm:hidden">
            Escolhe um projeto para ver os totais e a evolução no gráfico.
          </p>
        </div>
      )}
      {showLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-28 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-lg bg-muted" />
        </div>
      )}
      {hasError && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Não foi possível carregar as métricas. Tenta novamente mais tarde.
        </p>
      )}
      {data && data.projects.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Ainda não tens projetos. Publica um para começares a ver métricas.
        </p>
      )}
      {data && data.projects.length > 0 && stats && !hasError && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              label="Visualizações"
              icon={<Eye className="size-4" />}
              value={stats.totals.views}
              delta={computeDelta(stats.totals.views, stats.previous.views)}
            />
            <StatCard
              label="Visitas ao site"
              icon={<ExternalLink className="size-4" />}
              value={stats.totals.visits}
              delta={computeDelta(stats.totals.visits, stats.previous.visits)}
            />
            <StatCard
              label="Votos"
              icon={<Heart className="size-4" />}
              value={stats.totals.upvotes}
              delta={computeDelta(stats.totals.upvotes, stats.previous.upvotes)}
            />
            <StatCard
              label="Comentários"
              icon={<MessageCircle className="size-4" />}
              value={stats.totals.comments}
              delta={computeDelta(stats.totals.comments, stats.previous.comments)}
            />
          </div>
          <TrafficChart series={stats.series} />
        </>
      )}
    </div>
  );
}
