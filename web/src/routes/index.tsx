import { Header } from "@/components/header/header";
import { Page } from "@/layouts/page";
import { ProjectList } from "@/modules/project-list";
import { HomeSidebar } from "@/modules/project-list/components/home-sidebar/home-sidebar";
import { AnnouncementBanner } from "@/modules/settings/components/announcement-banner/announcement-banner";
import { createFileRoute } from "@tanstack/react-router";

const launchSections = [
  { period: "this_week", title: "Esta semana", id: "this-week-title" },
  { period: "last_week", title: "Semana passada", id: "last-week-title" },
  { period: "all", title: "Todos os lançamentos", id: "all-launches-title" },
] as const;

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
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
              Lançamentos
            </h2>
            <p className="text-sm text-muted-foreground">
              Explora, apoia e acompanha os lançamentos.
            </p>
          </div>
          <div className="lg:hidden">
            <HomeSidebar />
          </div>
          <div className="space-y-10">
            {launchSections.map(({ period, title, id }) => (
              <section key={period} aria-labelledby={id} className="space-y-3">
                <h3 id={id} className="border-b pb-3 text-lg font-semibold">
                  {title}
                </h3>
                <ProjectList period={period} />
              </section>
            ))}
          </div>
        </section>
      </div>
    </Page>
  );
}
