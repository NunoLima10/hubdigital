import { privatePageHead } from "@/lib/seo";
import { DashboardPage } from "@/modules/dashboard/components/dashboard-page/dashboard-page";
import { CommunityView } from "@/modules/invitations/components/community-view";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/community")({
  head: () => privatePageHead("Comunidade"),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <DashboardPage>
      <h1 className="hidden text-xl font-semibold lg:block">Comunidade</h1>
      <CommunityView />
    </DashboardPage>
  );
}
