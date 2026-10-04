import { Header } from "@/components/header/header";
import { Page } from "@/layouts/page";
import { ProjectList } from "@/modules/project-list";
import { HomeSidebar } from "@/modules/project-list/components/home-sidebar/home-sidebar";
import {
  ProjectFilters,
  type ProjectFilterValues,
} from "@/modules/project-list/components/project-filters/project-filters";
import { AnnouncementBanner } from "@/modules/settings/components/announcement-banner/announcement-banner";
import {
  islandValues,
  listPeriodValues,
  pricingValues,
  type ListPeriod,
} from "@hubdigital/shared";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

type HomeSearch = ProjectFilterValues & { period?: ListPeriod };
const periods: { value: ListPeriod; label: string }[] = [
  { value: "this_week", label: "Esta semana" },
  { value: "last_week", label: "Semana passada" },
  { value: "all", label: "Todos" },
];

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const period = listPeriodValues.includes(search.period as ListPeriod)
      ? (search.period as ListPeriod)
      : "this_week";
    const island = islandValues.includes(search.island as never)
      ? (search.island as HomeSearch["island"])
      : undefined;
    const pricing = pricingValues.includes(search.pricing as never)
      ? (search.pricing as HomeSearch["pricing"])
      : undefined;
    const categoryId = Number(search.categoryId);
    const q = typeof search.q === "string" ? search.q.trim() : "";
    return {
      period: period === "this_week" ? undefined : period,
      island,
      pricing,
      categoryId:
        Number.isFinite(categoryId) && categoryId > 0 ? categoryId : undefined,
      q: q || undefined,
    };
  },
  component: Home,
});

function Home() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { period = "this_week", ...filters } = search;
  const setFilters = (next: ProjectFilterValues) =>
    navigate({ search: { ...next, period } });
  const setPeriod = (next: ListPeriod) =>
    navigate({
      search: (current) => ({
        ...current,
        period: next === "this_week" ? undefined : next,
      }),
    });
  return (
    <Page
      banner={<AnnouncementBanner />}
      header={<Header />}
      rightSection={
        <div className="hidden lg:block">
          <HomeSidebar />
        </div>
      }
    >
      <div className="space-y-7">
        <div className="rounded-lg border bg-muted/40 px-5 py-5 sm:px-6">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Descobre o que Cabo Verde está a criar
          </h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Projetos e produtos da comunidade cabo-verdiana, reunidos num só
            lugar.
          </p>
        </div>
        <section aria-labelledby="projects-title" className="space-y-4">
          <div>
            <h2
              id="projects-title"
              className="text-xl font-semibold tracking-tight"
            >
              Projetos
            </h2>
            <p className="text-sm text-muted-foreground">
              Explora, apoia e acompanha os lançamentos.
            </p>
          </div>
          <ProjectFilters value={filters} onChange={setFilters} />
          <div className="lg:hidden">
            <HomeSidebar />
          </div>
          <div
            role="tablist"
            aria-label="Período"
            className="flex gap-1 border-b"
          >
            {periods.map((item) => (
              <button
                key={item.value}
                role="tab"
                aria-selected={period === item.value}
                className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${period === item.value ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                onClick={() => setPeriod(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <ProjectList period={period} filters={filters} />
        </section>
      </div>
    </Page>
  );
}
