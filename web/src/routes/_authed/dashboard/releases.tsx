import { DashboardPage } from "@/modules/dashboard/components/dashboard-page/dashboard-page";
import { Hearder } from "@/modules/releases/components/hearder/hearder";
import { ReleasesList } from "@/modules/releases/components/releases-list/releases-list";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/releases")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <DashboardPage>
      <Hearder />
      <ReleasesList />
    </DashboardPage>
  );
}
