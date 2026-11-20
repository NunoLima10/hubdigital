import { privatePageHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Page } from "@/layouts/page";
import { authClient } from "@/lib/auth-client";
import { DashboardHeader } from "@/modules/dashboard/components/header/header";
import { SideBar } from "@/modules/dashboard/components/side-bar/side-bar";
import { safeRedirect } from "@/modules/auth/utils/redirect";
import {
  createFileRoute,
  Navigate,
  Outlet,
  useLocation,
} from "@tanstack/react-router";

export const Route = createFileRoute("/_authed")({
  // Private pages: titled for the tab, never indexed.
  head: () => privatePageHead("Painel"),
  component: AuthedLayout,
});

function AuthedLayout() {
  const { data, isPending, error, refetch } = authClient.useSession();
  const location = useLocation();

  if (isPending) return <AuthenticatedRoutePending />;

  // A failed check (offline, rate limited, API restarting) says nothing about
  // the session: offer a retry instead of signing the user out of the page.
  if (error) return <SessionCheckFailed onRetry={() => void refetch()} />;

  // Send them to sign in and straight back to the page they asked for.
  if (!data) {
    return (
      <Navigate
        to="/sign-in"
        search={{ redirect: safeRedirect(location.href) }}
        replace
      />
    );
  }

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
          Tentar novamente
        </Button>
      </div>
    </Page>
  );
}
