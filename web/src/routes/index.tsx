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
      <h3 id={id} className="border-b pb-3 text-lg font-semibold">{title}</h3>
      <ProjectList period={period} />
    </section>
  );
}

function Home() {
  return (
    <Page
      banner={<AnnouncementBanner />}
      header={<Header />}
      rightSection={
        <div aria-hidden="true" className="hidden min-h-[445px] lg:block" />
      }
    >
      <div className="space-y-7">
        <section aria-labelledby="projects-title" className="space-y-4">
          <div>
            <h2
              id="projects-title"
              className="text-xl font-semibold tracking-tight"
            >
              Lançamentos
            </h2>
            <p className="text-sm text-muted-foreground">
              Explora, apoia e acompanha os lançamentos.
            </p>
          </div>
          <div className="space-y-10">
            {launchSections.map((section) => (
              <LaunchSection key={section.period} {...section} />
            ))}
          </div>
        </section>
      </div>
    </Page>
  );
}
