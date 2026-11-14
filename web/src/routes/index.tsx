import { Announcements } from "@/modules/community/project-community";
import { Header } from "@/components/header/header";
import { Page } from "@/layouts/page";
import { ProjectList } from "@/modules/project-list";
import { projectsQueryOptions, useProjects } from "@/modules/project-list/hooks/use-projects";
import { AnnouncementBanner } from "@/modules/settings/components/announcement-banner/announcement-banner";
import { noop } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { HomeSidebar } from "@/modules/project-list/components/home-sidebar/home-sidebar";

const launchSections = [
  {
    period: "this_week",
    sort: "upvotes",
    limit: 12,
    title: "Lançamentos desta semana",
    description: "Os projetos que a comunidade está a descobrir e apoiar agora.",
    id: "weekly-projects-title",
    showRank: true,
  },
  {
    period: "all",
    sort: "newest",
    limit: 12,
    title: "Projetos recentes",
    description: undefined,
    id: "recent-projects-title",
    showRank: false,
  },
  {
    period: "all",
    sort: "upvotes",
    limit: 5,
    title: "Mais apoiados",
    description: "Projetos que mais receberam apoio da comunidade.",
    id: "supported-projects-title",
    showRank: true,
  },
] as const;

export const Route = createFileRoute("/")({
  head: () => seo({ path: "/" }),
  loader: async ({ context }) => {
    await Promise.all(
      launchSections.map(({ period, sort, limit }) =>
        context.queryClient
          .query(projectsQueryOptions({ period, sort, limit }))
          .catch(noop),
      ),
    );
  },
  component: Home,
});

function LaunchSection({
  period,
  sort,
  limit,
  title,
  description,
  id,
  showRank,
}: (typeof launchSections)[number]) {
  const { data, isLoading, isError } = useProjects({ period, sort, limit });
  if (!isLoading && !isError && !data?.data.length) return null;
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div>
        <h2 id={id} className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <ProjectList period={period} sort={sort} limit={limit} showRank={showRank} />
    </section>
  );
}

function Home() {
  return (
    <Page
      viewTransition
      banner={<AnnouncementBanner />}
      header={<Header />}
      rightSection={<HomeSidebar />}
    >
      <div className="space-y-10">
        <Announcements limit={3} showLoadMore={false} hideWhenEmpty />
        {launchSections.map((section) => (
          <LaunchSection key={section.id} {...section} />
        ))}
      </div>
    </Page>
  );
}
