import { privatePageHead } from "@/lib/seo";
import { DashboardPage } from "@/modules/dashboard/components/dashboard-page/dashboard-page";
import { ReleasesHeader } from "@/modules/releases/components/header/releases-header";
import { ReleasesList } from "@/modules/releases/components/releases-list/releases-list";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/releases")({
  head: () => privatePageHead("Os meus projetos"),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <DashboardPage>
      <ReleasesHeader />
      <ReleasesList />
    </DashboardPage>
  );
}
