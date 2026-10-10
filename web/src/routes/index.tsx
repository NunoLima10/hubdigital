import { Header } from "@/components/header/header";
import { Page } from "@/layouts/page";
import { ProjectList } from "@/modules/project-list";
import { projectsQueryOptions, useProjects } from "@/modules/project-list/hooks/use-projects";
import { AnnouncementBanner } from "@/modules/settings/components/announcement-banner/announcement-banner";
import { createFileRoute } from "@tanstack/react-router";

const launchSections = [
  { period: "this_week", title: "Esta semana", id: "this-week-title" },
  { period: "last_week", title: "Semana passada", id: "last-week-title" },
  { period: "all", title: "Todos os lançamentos", id: "all-launches-title" },
] as const;

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(
        projectsQueryOptions({ period: "this_week" }),
      ),
      context.queryClient.prefetchQuery(
        projectsQueryOptions({ period: "last_week" }),
      ),
      context.queryClient.prefetchQuery(
        projectsQueryOptions({ period: "all" }),
      ),
    ]);
  },
  component: Home,
});

function LaunchSection({ period, title, id }: (typeof launchSections)[number]) {
  const { data, isLoading, isError } = useProjects({ period });
  if (!isLoading && !isError && !data?.data.length) return null;
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h3 id={id} className="text-lg font-semibold">{title}</h3>
      <ProjectList period={period} />
    </section>
  );
}

function ActivityPlaceholder() {
  return (
    <section aria-labelledby="activity-title" className="hidden rounded-lg border p-5 lg:block">
      <h2 id="activity-title" className="text-base font-semibold">Atividade da comunidade</h2>
      <p className="mt-1 text-sm text-muted-foreground">Gráfico em breve</p>
      <div aria-hidden="true" className="relative mt-6 h-48 rounded-md bg-muted/30">
        <div className="absolute inset-x-4 inset-y-5 flex flex-col justify-between">
          {[0, 1, 2, 3].map((line) => <div key={line} className="border-t border-dashed border-border" />)}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="rounded-md bg-background px-3 py-2 text-sm text-muted-foreground">Espaço reservado para o gráfico</span>
        </div>
      </div>
    </section>
  );
}

function Home() {
  return (
    <Page
      viewTransition
      banner={<AnnouncementBanner />}
      header={<Header />}
      rightSection={<ActivityPlaceholder />}
    >
      <div className="space-y-10">
        {launchSections.map((section) => (
          <LaunchSection key={section.period} {...section} />
        ))}
      </div>
    </Page>
  );
}
