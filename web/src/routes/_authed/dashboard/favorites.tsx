import { DashboardPage } from "@/modules/dashboard/components/dashboard-page/dashboard-page";
import { FavoritesView } from "@/modules/favorites/components/favorites-view";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/favorites")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <DashboardPage>
      <h1 className="hidden text-xl font-semibold lg:block">Favoritos</h1>
      <FavoritesView />
    </DashboardPage>
  );
}
