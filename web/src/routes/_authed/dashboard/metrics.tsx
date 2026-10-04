import { MetricsView } from "@/modules/project-stats/components/metrics-view/metrics-view";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/metrics")({
  component: MetricsView,
});
