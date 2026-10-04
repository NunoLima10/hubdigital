import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import type { StatsRange } from "@hubdigital/shared";
import { Eye, ExternalLink, Heart, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useMyProjectStats } from "../../hooks/use-my-project-stats";
import { computeDelta } from "../../utils/format";
import { ProjectStatsList } from "../project-stats-list/project-stats-list";
import { StatCard } from "../stat-card/stat-card";
import { TrafficChart } from "../traffic-chart/traffic-chart";

const ranges: { value: StatsRange; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
];
export function MetricsView() {
  const [range, setRange] = useState<StatsRange>("30d");
  const { data, isLoading, isError } = useMyProjectStats(range);
  const showLoading = useDelayedLoading(isLoading);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Desempenho</h1>
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
      {isError && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Não foi possível carregar as métricas. Tenta novamente mais tarde.
        </p>
      )}
      {data && data.projects.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Ainda não tens projetos. Publica um para começares a ver métricas.
        </p>
      )}
      {data && data.projects.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              label="Visualizações"
              icon={<Eye className="size-4" />}
              value={data.totals.views}
              delta={computeDelta(data.totals.views, data.previous.views)}
            />
            <StatCard
              label="Visitas ao site"
              icon={<ExternalLink className="size-4" />}
              value={data.totals.visits}
              delta={computeDelta(data.totals.visits, data.previous.visits)}
            />
            <StatCard
              label="Votos"
              icon={<Heart className="size-4" />}
              value={data.totals.upvotes}
              delta={computeDelta(data.totals.upvotes, data.previous.upvotes)}
            />
            <StatCard
              label="Comentários"
              icon={<MessageCircle className="size-4" />}
              value={data.totals.comments}
              delta={computeDelta(data.totals.comments, data.previous.comments)}
            />
          </div>
          <TrafficChart series={data.series} />
          <section className="space-y-3">
            <h2 className="font-semibold">Por projeto</h2>
            <ProjectStatsList projects={data.projects} />
          </section>
        </>
      )}
    </div>
  );
}
