import { DashboardPage } from "@/modules/dashboard/components/dashboard-page/dashboard-page";
import { MetricsView } from "@/modules/project-stats/components/metrics-view/metrics-view";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/metrics")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <DashboardPage>
      <MetricsView />
    </DashboardPage>
  );
}
