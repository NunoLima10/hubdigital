import { Page } from "@/layouts/page";
import { DashboardHeader } from "@/modules/dashboard/components/hearder/header";
import { SideBar } from "@/modules/dashboard/components/side-bar/side-bar";
import { ForceOnboarding } from "@/modules/onboarding/components/force-onboarding/force-onboarding";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ForceOnboarding>
      <Page header={<DashboardHeader />} leftSection={<SideBar />}>
        <Outlet />
      </Page>
    </ForceOnboarding>
  );
}
