import { Skeleton } from "@/components/ui/skeleton";
import { useSiteStats } from "@/modules/project-list/hooks/use-site-stats";
import { Popover } from "@base-ui/react/popover";
import { Info } from "lucide-react";

const formatNumber = new Intl.NumberFormat("pt-PT");
const formatMonth = new Intl.DateTimeFormat("pt-PT", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function StatBox({ value, label }: Readonly<{ value: number; label: string }>) {
  return (
    // Value above its label, while the markup keeps dt before dd.
    <div className="flex min-w-0 flex-col-reverse items-center rounded-lg border px-3 py-3 text-center">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-bold tracking-tight tabular-nums">
        {formatNumber.format(value)}
      </dd>
    </div>
  );
}

function AboutStats() {
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label="Sobre estas estatísticas"
        className="rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Info className="size-4" aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="start" className="z-50">
          <Popover.Popup className="max-w-64 rounded-lg border bg-popover p-3 text-xs leading-5 text-popover-foreground shadow-lg outline-none">
            Medido com PostHog, sem nomes nem emails. Atualizado a cada cinco minutos.
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** Same footprint as the loaded card, so nothing jumps when it arrives. */
function SiteStatsSkeleton() {
  return (
    <div role="status" aria-label="A carregar estatísticas">
      <Skeleton className="mb-3 h-6 w-36" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3">
            <Skeleton className="h-7 w-14" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The platform's own numbers (PostHog, via the API): this year, with the
 * all-time totals underneath. A skeleton while loading; nothing on error or
 * when PostHog is not configured — the home page never waits on it.
 */
export function SiteStatsCard() {
  const { data: stats, isPending } = useSiteStats();
  if (isPending) return <SiteStatsSkeleton />;
  if (!stats) return null;

  const since = stats.allTime.since
    ? formatMonth.format(new Date(stats.allTime.since))
    : null;

  return (
    <section aria-labelledby="site-stats-title">
      <div className="mb-3 flex items-center gap-2">
        <h2 id="site-stats-title" className="text-base font-semibold">
          Estatísticas {stats.year}
        </h2>
        <AboutStats />
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <StatBox value={stats.yearToDate.visitors} label="Visitantes" />
        <StatBox value={stats.yearToDate.pageviews} label="Páginas vistas" />
      </dl>
      {since && (
        <p className="mt-3 text-xs text-muted-foreground">
          Desde {since}: {formatNumber.format(stats.allTime.visitors)} visitantes ·{" "}
          {formatNumber.format(stats.allTime.pageviews)} páginas vistas
        </p>
      )}
    </section>
  );
}
