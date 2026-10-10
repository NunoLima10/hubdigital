import { Header } from "@/components/header/header";
import { ProjectMapView } from "@/modules/project-map/components/project-map-view";
import { projectsQueryOptions } from "@/modules/project-list/hooks/use-projects";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [{ title: "Mapa de projetos | HubDigital" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      projectsQueryOptions({ period: "all", sort: "upvotes", limit: 100 }),
    ),
  component: MapPage,
});

function MapPage() {
  useEffect(() => {
    document.documentElement.classList.add("hub-map-fullscreen");
    return () => document.documentElement.classList.remove("hub-map-fullscreen");
  }, []);

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <div className="shrink-0">
        <Header />
      </div>
      <main className="min-h-0 flex-1">
        <ProjectMapView />
      </main>
    </div>
  );
}
