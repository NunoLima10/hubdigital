import { Page } from "@/layouts/page";
import { authClient } from "@/lib/auth-client";
import { DashboardHeader } from "@/modules/dashboard/components/hearder/header";
import { SideBar } from "@/modules/dashboard/components/side-bar/side-bar";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed")({
  component: AuthedLayout,
});

function AuthedLayout() {
  const { useSession } = authClient;
  const { data, isPending, error } = useSession();

  //  // @ts-ignore
  //   const role = data?.user.role
  //   if (data && role != UserRole) signOut();

  if (isPending) return <AuthenticatedRoutePending />;

  if (error || !data) return <Navigate to={"/"} replace />;

  return <Outlet />;
}

function AuthenticatedRoutePending() {
  return (
    <Page header={<DashboardHeader />} leftSection={<SideBar />}>
      <div
        className="min-h-96"
        aria-label="A verificar sessÃ£o"
        aria-busy="true"
      />
    </Page>
  );
}
