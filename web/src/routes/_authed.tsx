import { privatePageHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Page } from "@/layouts/page";
import { authClient } from "@/lib/auth-client";
import { DashboardHeader } from "@/modules/dashboard/components/hearder/header";
import { SideBar } from "@/modules/dashboard/components/side-bar/side-bar";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed")({
  // Private pages: titled for the tab, never indexed.
  head: () => privatePageHead("Dashboard"),
  component: AuthedLayout,
});

function AuthedLayout() {
  const { data, isPending, error, refetch } = authClient.useSession();

  if (isPending) return <AuthenticatedRoutePending />;

  // A failed check (offline, rate limited, API restarting) says nothing about
  // the session: offer a retry instead of signing the user out of the page.
  if (error) return <SessionCheckFailed onRetry={() => void refetch()} />;

  if (!data) return <Navigate to={"/"} replace />;

  return <Outlet />;
}

function AuthenticatedRoutePending() {
  return (
    <Page header={<DashboardHeader />} leftSection={<SideBar />}>
      <div
        className="min-h-96"
        aria-label="A verificar sessão"
        aria-busy="true"
      />
    </Page>
  );
}

function SessionCheckFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <Page header={<DashboardHeader />} leftSection={<SideBar />}>
      <div className="flex min-h-96 flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">
          Não foi possível confirmar a tua sessão. Verifica a ligação e tenta de novo.
        </p>
        <Button variant="outline" onClick={onRetry}>
          Tentar de novo
        </Button>
      </div>
    </Page>
  );
}
