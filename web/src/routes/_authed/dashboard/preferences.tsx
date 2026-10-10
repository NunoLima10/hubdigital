import { DashboardPage } from "@/modules/dashboard/components/dashboard-page/dashboard-page";
import { PreferencesForm } from "@/modules/onboarding/components/preferences-form/preferences-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/preferences")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <DashboardPage>
      <div className="hidden lg:block">
        <h1 className="text-xl font-semibold">Preferências</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atualiza as respostas que deste ao entrar no HubDigital.
        </p>
      </div>
      <PreferencesForm />
    </DashboardPage>
  );
}
